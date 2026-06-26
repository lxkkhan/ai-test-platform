"""
FastAPI 路由定义
POST /invoke — 启动测试编排流程
GET /status/{thread_id} — 查询执行进度
"""
import logging
import time
from typing import Literal
from uuid import uuid4
from fastapi import APIRouter, HTTPException, Body, Query, Request
from pydantic import BaseModel, Field
from typing import Annotated
import json as json_lib
from orchestrator.graph import build_graph

logger = logging.getLogger(__name__)

router = APIRouter()
_graph_instance = None

def get_graph():
    global _graph_instance
    if _graph_instance is None:
        logger.info("Compiling LangGraph...")
        _graph_instance = build_graph()
        logger.info("LangGraph compiled")
    return _graph_instance

class InvokeRequest(BaseModel):
    story_id: str = Field(..., min_length=1, description="TAPD story ID")
    parallel: bool = True
    notify_on: Literal["always", "on_failure", "never"] = "always"

class StatusResponse(BaseModel):
    thread_id: str
    step: str = ""
    errors: list[str] = []
    finished: bool = False

_threads: dict[str, dict] = {}
_THREAD_TTL = 3600  # 1 hour

def _parse_params(body: dict | None, query_params: dict) -> InvokeRequest:
    params: dict[str, any] = {}
    if body and isinstance(body, dict):
        params.update(body)
    for key in ("story_id", "parallel", "notify_on"):
        val = query_params.get(key)
        if val is not None and key not in params:
            params[key] = val
    if "story_id" not in params or not params["story_id"]:
        raise HTTPException(422, detail="story_id is required")
    if "parallel" in params and isinstance(params["parallel"], str):
        params["parallel"] = params["parallel"].lower() in ("true", "1", "yes")
    return InvokeRequest(**params)

@router.post("/invoke")
async def invoke(req: Annotated[dict | None, Body()] = None,
                 story_id: Annotated[str | None, Query()] = None,
                 parallel: Annotated[str | None, Query()] = "true",
                 notify_on: Annotated[str | None, Query()] = "always"):
    query = {"story_id": story_id, "parallel": parallel, "notify_on": notify_on}
    try:
        model = _parse_params(req, query)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(422, detail="Invalid request format, expected JSON body or query params")

    thread_id = uuid4().hex
    logger.info("Invoke start: story_id=%s thread=%s parallel=%s notify=%s",
                model.story_id, thread_id, model.parallel, model.notify_on)
    graph = get_graph()
    initial = {
        "story_id": model.story_id,
        "analysis": None,
        "plan_id": None,
        "case_ids": [],
        "script_paths": [],
        "ui_test_results": [],
        "api_test_results": [],
        "bug_ids": [],
        "final_report": None,
        "steps": [],
        "errors": [],
        "parallel": model.parallel,
        "notify_on": model.notify_on,
    }
    config = {"configurable": {"thread_id": thread_id}}
    try:
        t0 = time.time()
        await graph.ainvoke(initial, config)
        elapsed = time.time() - t0
        state = graph.get_state(config)
        vals = state.values
        steps = vals.get("steps", [])
        _threads[thread_id] = {
            "step": steps[-1] if steps else "unknown",
            "errors": vals.get("errors", []),
            "finished": True,
            "elapsed": round(elapsed, 2),
        }
        logger.info("Invoke done: thread=%s steps=%s errors=%d elapsed=%.1fs",
                    thread_id, steps, len(vals.get("errors", [])), elapsed)
    except Exception as e:
        logger.exception("Invoke failed: thread=%s", thread_id)
        _threads[thread_id] = {"step": "error", "errors": [str(e)], "finished": True}

    return {"thread_id": thread_id, **_threads[thread_id]}

@router.get("/")
async def index():
    from fastapi.responses import HTMLResponse
    return HTMLResponse("""<!DOCTYPE html>
<html><head><title>测试编排引擎</title><meta charset="utf-8">
<style>body{font-family:Arial;max-width:500px;margin:50px auto;padding:20px}
input,button{padding:10px;font-size:16px;width:100%;box-sizing:border-box;margin:5px 0}
button{background:#4CAF50;color:white;border:none;cursor:pointer}
button:hover{background:#45a049}
.result{background:#f5f5f5;padding:10px;margin-top:10px;white-space:pre-wrap;font-size:12px}</style></head>
<body><h2>测试编排引擎</h2>
<form onsubmit="invoke(event)">
<input id="story_id" placeholder="TAPD Story ID (e.g. S-1120003271001000123)" required>
<button type="submit">执行测试流程</button></form>
<div id="result" class="result"></div>
<script>
async function invoke(e){e.preventDefault();
document.getElementById('result').textContent='执行中...';
const sid=document.getElementById('story_id').value;
try{const r=await fetch('/invoke?story_id='+sid+'&parallel=true&notify_on=always',{method:'POST'});
const d=await r.json();document.getElementById('result').textContent=JSON.stringify(d,null,2)}
catch(err){document.getElementById('result').textContent='Error: '+err.message}}
</script></body></html>""")

@router.get("/status/{thread_id}")
async def get_status(thread_id: str):
    # Clean expired entries
    now = time.time()
    expired = [k for k, v in _threads.items() if now - v.get("_ts", 0) > _THREAD_TTL]
    for k in expired:
        _threads.pop(k, None)

    info = _threads.get(thread_id)
    if not info:
        raise HTTPException(404, "thread not found")
    return StatusResponse(thread_id=thread_id, **{k: v for k, v in info.items() if k != "_ts"})
