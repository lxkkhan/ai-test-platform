"""
脚本组装节点
调用一期的 template-engine CLI，将标签化测试用例组装为可执行的 Playwright 脚本
"""
import asyncio
import json
import logging
import tempfile
from pathlib import Path
from orchestrator.state import TestState
from shared.config import settings

logger = logging.getLogger(__name__)

async def assemble_node(state: TestState) -> dict:
    cases = state.get("analysis", {}).get("features", [])
    if not cases:
        logger.info("No test cases to assemble")
        return {"script_paths": [], "steps": ["assemble"], "errors": ["no test cases to assemble"]}

    tag = state["story_id"]
    script = settings.template_engine_dir / "script-assembler.ts"
    if not script.exists():
        return {"script_paths": [], "steps": ["assemble"], "errors": [f"template-engine not found at {script}"]}

    with tempfile.TemporaryDirectory() as tmpdir:
        case_input = [{"targetPage": c, "operationType": "查询验证"} for c in cases]
        input_file = Path(tmpdir) / f"cases-{tag}.json"
        input_file.write_text(json.dumps(case_input, ensure_ascii=False), encoding="utf-8")

        logger.info("Assembling scripts for %d cases...", len(cases))
        proc = await asyncio.create_subprocess_exec(
            "npx", "tsx", str(script), "--file", str(input_file),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        try:
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=120)
        except asyncio.TimeoutError:
            proc.kill()
            logger.error("Template engine timed out after 120s")
            return {"script_paths": [], "steps": ["assemble"], "errors": ["template engine timed out"]}

        if proc.returncode != 0:
            err = stderr.decode()[:500]
            logger.error("Template engine failed: %s", err)
            return {"script_paths": [], "steps": ["assemble"], "errors": [err]}

        pool = settings.test_pool_dir
        scripts = sorted(pool.glob("*.spec.ts")) if pool.exists() else []
        logger.info("Assembled %d scripts", len(scripts))
        return {"script_paths": [str(s) for s in scripts], "steps": ["assemble"], "errors": []}
