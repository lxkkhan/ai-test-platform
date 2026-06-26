"""
接口测试节点
读取 OpenAPI 规范文件（merged-api-spec.yaml），遍历所有接口发送 HTTP 请求验证
"""
import logging
import yaml
import httpx
from pathlib import Path
from orchestrator.state import TestState
from shared.config import settings

logger = logging.getLogger(__name__)

HTTP_METHODS = {"get", "post", "put", "patch", "delete", "head", "options", "trace"}

async def api_test_node(state: TestState) -> dict:
    spec_path = settings.spec_path
    if not spec_path.exists():
        return {"api_test_results": [], "steps": ["api_test"], "errors": [f"spec not found at {spec_path}"]}

    with open(spec_path, encoding="utf-8") as f:
        spec = yaml.safe_load(f)

    base_url = spec.get("servers", [{}])[0].get("url", "http://localhost")
    paths = spec.get("paths", {})
    results = []
    errors = []

    async with httpx.AsyncClient(base_url=base_url, timeout=15) as cli:
        for path, methods in paths.items():
            for method, op in methods.items():
                if method not in HTTP_METHODS:
                    continue
                try:
                    url = path
                    params = {}
                    body = None
                    for p in op.get("parameters", []):
                        if p.get("in") == "query":
                            params[p["name"]] = p.get("schema", {}).get("example", "")
                    req_body = op.get("requestBody", {})
                    if req_body:
                        content = req_body.get("content", {}).get("application/json", {})
                        body = content.get("example") or content.get("schema", {})

                    kwargs = {"params": params}
                    if body and method in ("post", "put", "patch"):
                        kwargs["json"] = body

                    resp = await cli.request(method.upper(), url, **kwargs)
                    results.append({
                        "path": path, "method": method.upper(),
                        "status_code": resp.status_code,
                        "status": "pass" if resp.is_success else "fail",
                    })
                except Exception as e:
                    logger.debug("API test failed: %s %s - %s", method.upper(), path, e)
                    errors.append(f"{method.upper()} {path}: {e}")
                    results.append({"path": path, "method": method.upper(), "status": "error", "error": str(e)})

    logger.info("API test complete: %d/%d passed", sum(1 for r in results if r.get("status") == "pass"), len(results))
    return {"api_test_results": results, "steps": ["api_test"], "errors": errors}
