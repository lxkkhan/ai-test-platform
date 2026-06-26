"""
需求分析节点
调用 TAPD API 获取需求详情，返回给下一个节点
"""
import logging
from orchestrator.state import TestState
from shared.tapd_client import TAPDClient

logger = logging.getLogger(__name__)

async def analyze_node(state: TestState) -> dict:
    story_id = state["story_id"]
    logger.info("Analyzing story: %s", story_id)
    client = TAPDClient()
    try:
        try:
            story = await client.get_story(story_id)
        except Exception as e:
            logger.warning("Failed to fetch story %s: %s", story_id, e)
            return {
                "analysis": {"story_id": story_id, "title": story_id, "description": "", "status": "unknown"},
                "steps": ["analyze"],
                "errors": [f"TAPD API error: {e}"],
            }

        if isinstance(story, dict):
            title = story.get("name", "") or story.get("title", story_id)
            logger.info("Story %s: %s", story_id, title)
            return {
                "analysis": {
                    "story_id": story_id,
                    "title": title,
                    "description": story.get("description", ""),
                    "status": story.get("status", ""),
                },
                "steps": ["analyze"],
                "errors": [],
            }
        else:
            return {
                "analysis": {"story_id": story_id, "title": story_id, "description": str(story), "status": ""},
                "steps": ["analyze"],
                "errors": [f"unexpected response type: {type(story).__name__}"],
            }
    finally:
        await client.close()
