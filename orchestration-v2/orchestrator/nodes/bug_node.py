"""
自动提 Bug 节点
遍历 UI 和 API 测试结果，将失败用例自动提交 Bug 到 TAPD
"""
import logging
from orchestrator.state import TestState
from shared.tapd_client import TAPDClient

logger = logging.getLogger(__name__)

def _safe_get_id(bug_response):
    """安全提取 Bug ID，兼容 None 值"""
    if not isinstance(bug_response, dict):
        return None
    bid = bug_response.get("id")
    if bid is not None:
        return bid
    return bug_response.get("data", {}).get("id")

async def bug_node(state: TestState) -> dict:
    client = TAPDClient()
    bug_ids = []
    errors = []
    try:
        for r in (state.get("ui_test_results") or []):
            if r.get("status") != "pass":
                try:
                    bug = await client.create_bug(
                        title=f"[auto] UI test fail: {r.get('file', 'unknown')}",
                        content=f"errors:\n{r.get('errors', '')}\noutput:\n{r.get('output', '')}",
                        story_id=state["story_id"],
                    )
                    bid = _safe_get_id(bug)
                    if bid is not None:
                        bug_ids.append(str(bid))
                except Exception as e:
                    errors.append(f"create UI bug: {e}")

        for r in (state.get("api_test_results") or []):
            if r.get("status") != "pass":
                try:
                    bug = await client.create_bug(
                        title=f"[auto] API test fail: {r['method']} {r['path']}",
                        content=f"status: {r.get('status_code', 'N/A')}\nerror: {r.get('error', '')}",
                        story_id=state["story_id"],
                    )
                    bid = _safe_get_id(bug)
                    if bid is not None:
                        bug_ids.append(str(bid))
                except Exception as e:
                    errors.append(f"create API bug: {e}")
    except Exception as e:
        errors.append(str(e))
        logger.exception("bug_node failed")
    finally:
        await client.close()

    return {"bug_ids": bug_ids, "steps": ["bug"], "errors": errors}
