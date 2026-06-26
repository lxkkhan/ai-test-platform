"""
UI 自动化测试节点
调用 auto-test-runner 执行 Playwright 测试脚本，返回执行结果
"""
import asyncio
import logging
from pathlib import Path
from orchestrator.state import TestState
from shared.config import settings

logger = logging.getLogger(__name__)

async def ui_test_node(state: TestState) -> dict:
    scripts = state.get("script_paths") or []
    if not scripts:
        logger.info("No UI test scripts to run")
        return {"ui_test_results": [], "steps": ["ui_test"], "errors": []}

    runner = settings.auto_test_runner_dir / "run-tests.ts"
    if not runner.exists():
        runner = Path(settings.template_engine_dir).parent.parent / "auto-test-runner" / "scripts" / "run-tests.ts"
    if not runner.exists():
        return {"ui_test_results": [{"error": f"auto-test-runner not found at {runner}"}],
                "steps": ["ui_test"], "errors": ["runner not found"]}

    test_file = scripts[0]
    logger.info("Running UI test: %s", test_file)
    proc = await asyncio.create_subprocess_exec(
        "npx", "tsx", str(runner), test_file,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    try:
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=300)
    except asyncio.TimeoutError:
        proc.kill()
        logger.error("UI test timed out after 300s")
        return {"ui_test_results": [{"file": test_file, "status": "error", "error": "timed out"}],
                "steps": ["ui_test"], "errors": ["test timed out"]}

    passed = proc.returncode == 0
    logger.info("UI test %s: %s", "PASSED" if passed else "FAILED", test_file)
    return {
        "ui_test_results": [{
            "file": test_file,
            "status": "pass" if passed else "fail",
            "output": stdout.decode()[-500:],
            "errors": stderr.decode()[-500:],
        }],
        "steps": ["ui_test"],
        "errors": [] if passed else [stderr.decode()[:300]],
    }
