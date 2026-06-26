"""
企业微信通知客户端
通过 Webhook 推送测试执行结果、Bug 提醒等消息
支持自动重试（3次，指数退避）
"""
import asyncio
import logging
import httpx
from .config import settings

logger = logging.getLogger(__name__)
MAX_RETRIES = 3

class WeChatNotifier:
    def __init__(self):
        self.url = settings.wechat_webhook_url
        self.mentioned = settings.wechat_mentioned_list

    async def send(self, title: str, content: str, msg_type: str = "markdown"):
        if not self.url:
            logger.warning("WeChat webhook URL not configured, notification skipped")
            return {"sent": False, "reason": "webhook URL not configured"}
        payload = {
            "msgtype": msg_type,
            msg_type: {
                "content": f"# {title}\n{content}\n" + "".join(f"<@{u}>" for u in self.mentioned if u)
            }
        }
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                async with httpx.AsyncClient(timeout=15) as cli:
                    r = await cli.post(self.url, json=payload)
                    if r.is_success:
                        logger.info("WeChat notification sent: %s", title[:50])
                        return {"sent": True, "status": r.status_code}
                    if r.status_code == 429 and attempt < MAX_RETRIES:
                        wait = 2 ** attempt
                        logger.warning("WeChat rate limited, retry %d/%d after %ds", attempt, MAX_RETRIES, wait)
                        await asyncio.sleep(wait)
                        continue
                    logger.warning("WeChat send failed: status=%d body=%s", r.status_code, r.text[:100])
                    return {"sent": False, "status": r.status_code}
            except Exception as e:
                if attempt < MAX_RETRIES:
                    wait = 2 ** attempt
                    logger.warning("WeChat send error: %s, retry %d/%d after %ds", e, attempt, MAX_RETRIES, wait)
                    await asyncio.sleep(wait)
                    continue
                logger.error("WeChat send failed after %d retries: %s", MAX_RETRIES, e)
                return {"sent": False, "error": str(e)}
        return {"sent": False}

    async def notify_analysis(self, story_id: str, summary: str):
        await self.send(f"Analysis complete: {story_id}", summary)

    async def notify_execution(self, story_id: str, passed: int, failed: int, report_url: str = ""):
        status = "All passed" if failed == 0 else f"{failed} failed"
        detail = f"Passed: {passed} | Failed: {failed}"
        if report_url:
            detail += f"\nReport: {report_url}"
        await self.send(f"Test execution complete: {story_id} ({status})", detail)

    async def notify_bug(self, bug_id: str, title: str):
        await self.send(f"New Bug #{bug_id}", f"Title: {title}")
