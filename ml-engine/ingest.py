"""
Meridian ML Engine — Ingestion Endpoint
========================================
POST /ingest → 202 Accepted instantly.
ML processing runs in a BackgroundTasks queue.
"""

from __future__ import annotations

import logging
import time
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks

import redis.asyncio as aioredis

from models import TelemetryPayload, IngestResponse, ProductState
from features import extract_product_id, build_features, compute_target_multiplier
from ml_pipeline import train_and_predict
from redis_lock import optimistic_update

logger = logging.getLogger("meridian.ingest")

router = APIRouter()

# Will be set by main.py on startup
redis_client: aioredis.Redis | None = None


def set_redis(client: aioredis.Redis) -> None:
    """Called by main.py to inject the Redis client."""
    global redis_client
    redis_client = client


async def _process_event(event: TelemetryPayload) -> None:
    """
    Background task: full ML pipeline for a single telemetry event.

    Flow:
      1. Extract product_id from the event
      2. Read product state from Redis (via optimistic lock)
      3. Update state based on event type
      4. Build feature vector
      5. Compute heuristic target multiplier
      6. Train River model + get prediction
      7. Write new state + multiplier atomically (WATCH/MULTI/EXEC)
    """
    start_time = time.perf_counter()

    if redis_client is None:
        logger.error("Redis not initialized — skipping event")
        return

    product_id = extract_product_id(event)
    if product_id is None:
        # Page-level events (dwell_time, page_view) don't target a product
        logger.debug(f"Skipping non-product event: {event.event_type}")
        return

    logger.info(
        f"📥 Processing {event.event_type} for product={product_id} "
        f"session={event.session_id[:8]}..."
    )

    async def transform(state: ProductState) -> ProductState:
        """
        Transform function passed to optimistic_update.
        Runs inside the WATCH window.
        """
        # ─── Update state based on event type ────────────────────
        if event.event_type == "inventory_drop_sim":
            state.stock_level = event.payload.get(
                "stock_remaining", state.stock_level
            )

        elif event.event_type == "competitor_price_sim":
            state.last_competitor_price = event.payload.get(
                "competitor_price", state.last_competitor_price
            )

        elif event.event_type == "cart_addition":
            # Each cart addition reduces available stock by 1
            state.stock_level = max(0, state.stock_level - 1)

        # Increment view count
        state.recent_views += 1

        # ─── Feature engineering ─────────────────────────────────
        features = await build_features(redis_client, event, state)

        # ─── Compute target for online learning ──────────────────
        target = compute_target_multiplier(event, state)

        # ─── Audit cooldown check (60s per product) ─────────────
        cooldown_key = f"last_audit:{product_id}"
        audit_pending = await redis_client.exists(cooldown_key)
        skip_audit = bool(audit_pending)

        # ─── Train + predict ─────────────────────────────────────
        multiplier, was_audited = train_and_predict(
            features,
            target,
            product_id=product_id,
            current_stock=state.stock_level,
            event_type=event.event_type,
            skip_audit=skip_audit,
            current_multiplier=state.price_multiplier,
        )

        # Set cooldown key if audit actually ran
        if was_audited:
            await redis_client.set(cooldown_key, "1", ex=60)

        # ─── Update state with new multiplier ────────────────────
        state.price_multiplier = multiplier
        state.updated_at = datetime.now(timezone.utc).isoformat()

        return state

    try:
        final_state = await optimistic_update(redis_client, product_id, transform)
        processing_ms = (time.perf_counter() - start_time) * 1000
        logger.info(
            f"✅ {event.event_type} → product={product_id} "
            f"multiplier={final_state.price_multiplier:.4f} "
            f"stock={final_state.stock_level} "
            f"[⏱️ {processing_ms:.2f}ms]"
        )
    except RuntimeError as e:
        processing_ms = (time.perf_counter() - start_time) * 1000
        logger.error(f"❌ {e} [⏱️ {processing_ms:.2f}ms]")


# =============================================================================
# HTTP Endpoint
# =============================================================================

@router.post(
    "/ingest",
    response_model=IngestResponse,
    status_code=202,
    summary="Ingest telemetry event",
    description="Accepts a telemetry payload, returns 202 immediately, "
                "and processes the ML pipeline in the background.",
)
async def ingest(
    event: TelemetryPayload,
    background_tasks: BackgroundTasks,
) -> IngestResponse:
    """
    POST /ingest — Fire-and-forget ML processing.

    The HTTP response returns 202 Accepted instantly.
    The actual ML pipeline runs asynchronously in BackgroundTasks.
    """
    background_tasks.add_task(_process_event, event)

    return IngestResponse(
        status="accepted",
        message=f"Event '{event.event_type}' queued for ML processing",
    )
