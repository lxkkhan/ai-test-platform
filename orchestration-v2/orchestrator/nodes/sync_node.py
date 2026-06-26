"""
TAPD 结果回写节点
将 UI 和 API 测试结果回写到 TAPD 测试用例的执行状态中
"""
import logging
from orchestrator.state import TestState
from shared.tapd_client import TAPDClient

logger = logging.getLogger(__name__)

async def sync_node(state: TestState) -> dict:
    case_ids = state.get("case_ids") or []
    if not case_ids:
        return {"steps": ["sync"], "errors": ["no case_ids to sync"]}

    client = TAPDClient()
    errors = []
    results = (state.get("ui_test_results") or []) + (state.get("api_test_results") or [])
    try:
        for idx, r in enumerate(results):
            if idx >= len(case_ids):
                errors.append(f"more results than case_ids, skipping result #{idx}")
                break
            case_id = case_ids[idx]
            if r.get("status") == "pass":
                status = "pass"
            elif r.get("status") == "error":
                status = "block"
            else:
                status = "no_pass"
            remark = r.get("output", "") or r.get("error", "") or ""
            await client.update_case_result(case_id, status, remark[:500])
    except Exception as e:
        errors.append(str(e))
        logger.exception("sync_node failed")
    finally:
        await client.close()

    return {"steps": ["sync"], "errors": errors}
