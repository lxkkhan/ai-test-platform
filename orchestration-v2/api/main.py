"""
FastAPI 应用入口
启动编排引擎 API 服务，暴露 /invoke、/status、/health 端点
"""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Test Orchestrator V2", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/ready")
async def ready():
    return {"status": "ready"}

app.include_router(router)
logger.info("Orchestrator API started")
