"""
Meridian ML Engine — FastAPI Application
==========================================
Real-time ML pricing engine that ingests telemetry, runs online regression
(River), and writes dynamic price multipliers to Redis.

Startup:
  1. Connect to Redis (async pool)
  2. Start Pub/Sub subscriber (background task)
  3. Register routes

Shutdown:
  1. Cancel Pub/Sub subscriber
  2. Close Redis pool
"""

from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager

import redis.asyncio as aioredis
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from ingest import router as ingest_router, set_redis, _process_event
from ml_pipeline import get_model_stats
from redis_lock import read_price_multiplier
from subscriber import subscribe_to_telemetry

# =============================================================================
# Logging
# =============================================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(name)-25s │ %(levelname)-5s │ %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("meridian.main")

# =============================================================================
# App Lifecycle
# =============================================================================

redis_pool: aioredis.Redis | None = None
subscriber_task: asyncio.Task | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manages async Redis pool and Pub/Sub subscriber lifecycle.
    """
    global redis_pool, subscriber_task

    # ─── Startup ─────────────────────────────────────────────────
    logger.info(f"🚀 Starting {settings.app_name}")
    logger.info(f"📡 Connecting to Redis: {settings.redis_url}")

    redis_pool = aioredis.from_url(
        settings.redis_url,
        decode_responses=True,
        max_connections=20,
    )

    # Verify Redis connection
    try:
        await redis_pool.ping()
        logger.info("✅ Redis connected")
    except Exception as e:
        logger.error(f"❌ Redis connection failed: {e}")

    # Inject Redis into the ingest router
    set_redis(redis_pool)

    # Start Pub/Sub subscriber as background task
    subscriber_task = asyncio.create_task(
        subscribe_to_telemetry(settings.redis_url, _process_event)
    )
    logger.info("📡 Pub/Sub subscriber started")

    yield

    # ─── Shutdown ────────────────────────────────────────────────
    logger.info("Shutting down...")

    if subscriber_task:
        subscriber_task.cancel()
        try:
            await subscriber_task
        except asyncio.CancelledError:
            pass

    if redis_pool:
        await redis_pool.aclose()
        logger.info("Redis pool closed")


# =============================================================================
# FastAPI App
# =============================================================================

app = FastAPI(
    title="Meridian ML Engine",
    description="Real-time dynamic pricing via online regression (River)",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:4000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(ingest_router)


# =============================================================================
# Health & Status Endpoints
# =============================================================================

@app.get("/health", summary="Service health check")
async def health():
    redis_ok = False
    if redis_pool:
        try:
            await redis_pool.ping()
            redis_ok = True
        except Exception:
            pass

    return {
        "status": "healthy" if redis_ok else "degraded",
        "service": settings.app_name,
        "redis": "connected" if redis_ok else "disconnected",
        "model": get_model_stats(),
    }


@app.get(
    "/price/{product_id}",
    summary="Get current dynamic price multiplier",
)
async def get_price(product_id: str):
    """
    Returns the current ML-predicted price multiplier for a product.
    The NestJS backend can call this to fetch the dynamic price at checkout.
    """
    if not redis_pool:
        return {"product_id": product_id, "multiplier": 1.0, "source": "default"}

    multiplier = await read_price_multiplier(redis_pool, product_id)
    return {
        "product_id": product_id,
        "multiplier": multiplier,
        "source": "ml_predicted" if multiplier != 1.0 else "default",
    }
