"""
全局配置
读取一期技能的共享配置（TAPD 凭证）、环境变量，以及各工具路径
"""
import os
import json
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parents[1]
SKILL_DIR = PROJECT_ROOT.parent / ".opencode" / "skills"
SHARED_CONFIG_PATH = SKILL_DIR / "_shared" / "tapd-config.json"

def load_tapd_config() -> dict:
    """加载 TAPD 共享配置，支持 _extends 继承"""
    try:
        with open(SHARED_CONFIG_PATH, encoding="utf-8") as f:
            raw = json.load(f)
        if "_extends" in raw:
            ext_path = SHARED_CONFIG_PATH.parent / raw["_extends"]
            with open(ext_path, encoding="utf-8") as ef:
                base = json.load(ef)
                base.update(raw)
                return base
        return raw
    except Exception as e:
        logger.warning("Failed to load TAPD config from %s: %s", SHARED_CONFIG_PATH, e)
        return {}

class Settings:
    def __init__(self):
        cfg = load_tapd_config()
        self.tapd: dict = cfg or {
            "workspace_id": os.getenv("TAPD_WS_ID", ""),
            "api_user": os.getenv("TAPD_API_USER", ""),
            "api_password": os.getenv("TAPD_API_PASSWORD", ""),
            "api_url": os.getenv("TAPD_API_URL", "https://api.tapd.cn"),
        }
        self.wechat_webhook_url: str = os.getenv("WECHAT_WEBHOOK_URL", "")
        raw_mentioned = os.getenv("WECHAT_MENTIONED_LIST", "")
        self.wechat_mentioned_list: list[str] = [u for u in raw_mentioned.split(",") if u.strip()]

        base = PROJECT_ROOT.parent
        # Docker env: use mounted path; local env: use ../.opencode/...
        docker_spec = Path("/app/specs/merged-api-spec.yaml")
        local_spec = base / ".opencode" / "skills" / "apifox-sync" / "output" / "merged-api-spec.yaml"
        self.spec_path: Path = docker_spec if docker_spec.exists() else local_spec
        self.test_pool_dir: Path = SKILL_DIR / "template-engine" / "test_pool"
        self.template_engine_dir: Path = SKILL_DIR / "template-engine" / "scripts"
        self.auto_test_runner_dir: Path = SKILL_DIR / "playwright-mind" / "scripts"
        self.model_endpoint: Optional[str] = None

settings = Settings()
