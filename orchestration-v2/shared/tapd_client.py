"""
TAPD API 客户端
封装 TAPD REST API 的异步调用，支持需求、测试计划、用例、Bug 等操作
支持自动重试（3 次，指数退避）
"""
import asyncio
import logging
import httpx
from .config import settings

logger = logging.getLogger(__name__)

BASE = settings.tapd["api_url"].rstrip("/")
API_USER = settings.tapd["api_user"]
API_PASSWORD = settings.tapd["api_password"]
WS_ID = settings.tapd["workspace_id"]
HEADERS = {"Content-Type": "application/json"}
MAX_RETRIES = 3

class TAPDClientError(Exception):
    pass

async def _request(method: str, url: str, **kwargs) -> httpx.Response:
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            async with httpx.AsyncClient(base_url=BASE, auth=(API_USER, API_PASSWORD),
                                         headers=HEADERS, timeout=30) as cli:
                r = await cli.request(method, url, **kwargs)
                if r.status_code == 429:
                    wait = 2 ** attempt
                    logger.warning("TAPD rate limited, retry %d/%d after %ds", attempt, MAX_RETRIES, wait)
                    await asyncio.sleep(wait)
                    continue
                r.raise_for_status()
                return r
        except httpx.HTTPStatusError as e:
            if e.response.status_code >= 500 and attempt < MAX_RETRIES:
                wait = 2 ** attempt
                logger.warning("TAPD %d, retry %d/%d after %ds", e.response.status_code, attempt, MAX_RETRIES, wait)
                await asyncio.sleep(wait)
                continue
            raise
        except (httpx.TimeoutException, httpx.NetworkError) as e:
            if attempt < MAX_RETRIES:
                wait = 2 ** attempt
                logger.warning("TAPD network error: %s, retry %d/%d after %ds", e, attempt, MAX_RETRIES, wait)
                await asyncio.sleep(wait)
                continue
            raise
    raise TAPDClientError(f"TAPD request failed after {MAX_RETRIES} retries: {method} {url}")

class TAPDClient:
    async def close(self):
        pass

    async def get_story(self, story_id: str) -> dict:
        r = await _request("GET", f"/api/stories/{story_id}", params={"workspace_id": WS_ID})
        data = r.json()
        return data if isinstance(data, dict) else {"id": story_id, "name": str(data)}

    async def create_test_plan(self, name: str, story_id: str) -> dict:
        r = await _request("POST", "/api/test_plans", json={
            "workspace_id": WS_ID, "name": name, "description": f"auto-created for story {story_id}"
        })
        data = r.json()
        return data if isinstance(data, dict) else {"id": str(data)}

    async def bulk_create_cases(self, plan_id: str, cases: list[dict]) -> list[dict]:
        r = await _request("POST", "/api/test_cases/bulk", json={
            "workspace_id": WS_ID, "test_plan_id": plan_id, "cases": cases
        })
        data = r.json()
        if isinstance(data, list):
            return data
        return data.get("data", [])

    async def update_case_result(self, case_id: str, status: str, remark: str = ""):
        await _request("PUT", f"/api/test_cases/{case_id}/execution", json={
            "workspace_id": WS_ID, "status": status, "remark": remark
        })

    async def create_bug(self, title: str, content: str, story_id: str) -> dict:
        r = await _request("POST", "/api/bugs", json={
            "workspace_id": WS_ID, "title": title[:200], "description": content, "story_id": story_id,
        })
        data = r.json()
        return data if isinstance(data, dict) else {"id": str(data)}

    async def link_story(self, bug_id: str, story_id: str):
        await _request("POST", f"/api/bugs/{bug_id}/link_story", json={
            "workspace_id": WS_ID, "story_id": story_id
        })
