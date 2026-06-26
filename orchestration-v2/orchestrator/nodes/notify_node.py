"""
企业微信通知节点
汇总测试执行结果，通过企业微信 Webhook 推送通知
"""
import logging
from orchestrator.state import TestState
from shared.wechat_client import WeChatNotifier

logger = logging.getLogger(__name__)

async def notify_node(state: TestState) -> dict:
    notifier = WeChatNotifier()
    ui_results = state.get("ui_test_results") or []
    api_results = state.get("api_test_results") or []
    passed = sum(1 for r in ui_results if r.get("status") == "pass")
    failed = sum(1 for r in ui_results if r.get("status") != "pass")
    passed += sum(1 for r in api_results if r.get("status") == "pass")
    failed += sum(1 for r in api_results if r.get("status") != "pass")

    logger.info("Notifying: story=%s passed=%d failed=%d", state["story_id"], passed, failed)
    try:
        await notifier.notify_execution(state["story_id"], passed, failed)
    except Exception as e:
        logger.exception("Notification failed")
        return {"steps": ["notify"], "errors": [str(e)]}

    return {"steps": ["notify"], "errors": []}
