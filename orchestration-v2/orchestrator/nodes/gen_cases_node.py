"""
生成用例节点
在 TAPD 中创建测试计划和测试用例，返回 plan_id 和 case_ids
"""
import logging
from orchestrator.state import TestState
from shared.tapd_client import TAPDClient

logger = logging.getLogger(__name__)

async def gen_cases_node(state: TestState) -> dict:
    analysis = state.get("analysis") or {}
    title = analysis.get("title", state["story_id"]) if isinstance(analysis, dict) else state["story_id"]
    client = TAPDClient()
    try:
        try:
            plan = await client.create_test_plan(f"auto-test: {title}", state["story_id"])
            plan_id = plan.get("id") or plan.get("data", {}).get("id") if isinstance(plan, dict) else None
            if plan_id is None:
                return {"plan_id": None, "case_ids": [], "steps": ["gen_cases"], "errors": ["plan created but no plan_id returned"]}
            plan_id = str(plan_id)

            cases = await client.bulk_create_cases(plan_id, [
                {"name": "UI 自动化测试", "description": "Playwright 自动生成的 UI 测试用例"},
                {"name": "API 接口测试", "description": "基于 OpenAPI 规范的接口测试用例"},
            ])
            case_ids = [c.get("id") for c in cases if c.get("id")]
            logger.info("Created plan=%s with %d cases", plan_id, len(case_ids))
            return {"plan_id": plan_id, "case_ids": case_ids, "steps": ["gen_cases"], "errors": []}
        except Exception as e:
            logger.exception("create test plan failed")
            return {"plan_id": None, "case_ids": [], "steps": ["gen_cases"], "errors": [f"create test plan failed: {e}"]}
    finally:
        await client.close()
