"""
Meridian ML Engine — Redis Optimistic Locking
===============================================
Implements WATCH/MULTI/EXEC transactions for race-condition-safe
product state updates. This is the most critical infrastructure piece.

Flow:
  1. WATCH the key `product_state:{product_id}`
  2. Read the current state
  3. Run ML prediction → get new price_multiplier
  4. Start MULTI transaction
  5. Write updated state + `dynamic_price:{product_id}`
  6. EXEC the pipeline
  7. On WatchError → exponential backoff → retry

This ensures that if 100 concurrent requests hit the same product,
only one wins per cycle — the rest retry safely.
"""

from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Callable, Awaitable

import redis.asyncio as aioredis
from redis.exceptions import WatchError

from models import ProductState

logger = logging.getLogger("meridian.redis_lock")

# Channel for real-time price chart updates
PRICE_UPDATE_CHANNEL = "meridian_price_updates"

# Key prefixes
STATE_KEY = "product_state:{product_id}"
PRICE_KEY = "dynamic_price:{product_id}"

MAX_RETRIES = 5
BASE_BACKOFF_MS = 50  # 50ms base, doubles each retry


def _state_key(product_id: str) -> str:
    return STATE_KEY.format(product_id=product_id)


def _price_key(product_id: str) -> str:
    return PRICE_KEY.format(product_id=product_id)


async def get_product_state(
    redis: aioredis.Redis,
    product_id: str,
) -> ProductState:
    """
    Read the current product state from Redis.
    Returns a default state if the key doesn't exist.
    """
    raw = await redis.get(_state_key(product_id))
    if raw is None:
        return ProductState(product_id=product_id)
    return ProductState.model_validate_json(raw)


async def optimistic_update(
    redis: aioredis.Redis,
    product_id: str,
    transform: Callable[[ProductState], Awaitable[ProductState]],
) -> ProductState:
    """
    Atomically update product state using Redis optimistic locking.

    Args:
        redis:       Async Redis client (from the connection pool)
        product_id:  Product to update
        transform:   Async function that takes current state → returns new state.
                     This is where the ML prediction + feature engineering runs.

    Returns:
        The successfully committed ProductState.

    Raises:
        RuntimeError: If all retries are exhausted (extreme contention).
    """
    key = _state_key(product_id)
    price_key = _price_key(product_id)

    for attempt in range(MAX_RETRIES):
        try:
            # ─── Step 1: WATCH the key ───────────────────────────────
            async with redis.pipeline(transaction=True) as pipe:
                await pipe.watch(key)

                # ─── Step 2: Read current state (outside transaction) ─
                raw = await pipe.get(key)
                current_state = (
                    ProductState.model_validate_json(raw)
                    if raw
                    else ProductState(product_id=product_id)
                )

                # ─── Step 2.5: Check for human override ──────────────
                override_val = await redis.get(f"override:{product_id}")

                if override_val is not None:
                    # Human override active — skip ML prediction entirely
                    override_multiplier = float(override_val)
                    new_state = current_state.model_copy()
                    new_state.price_multiplier = override_multiplier
                    new_state.updated_at = datetime.now(timezone.utc).isoformat()

                    logger.info(
                        f"🔒 [HUMAN OVERRIDE] product={product_id} "
                        f"multiplier={override_multiplier:.4f} — ML skipped"
                    )
                else:
                    # ─── Step 3: Run the transform (ML prediction) ────
                    # This happens OUTSIDE the MULTI block so it can be async
                    new_state = await transform(current_state)

                # ─── Step 4: Start MULTI transaction ─────────────────
                pipe.multi()

                # ─── Step 5: Write updated state + price multiplier ──
                state_json = new_state.model_dump_json()
                pipe.set(key, state_json)
                pipe.set(
                    price_key,
                    json.dumps({
                        "product_id": product_id,
                        "multiplier": new_state.price_multiplier,
                        "updated_at": new_state.updated_at,
                    }),
                )

                # ─── Step 6: EXEC ────────────────────────────────────
                await pipe.execute()

                logger.info(
                    f"✅ product={product_id} multiplier={new_state.price_multiplier:.4f} "
                    f"(attempt {attempt + 1})"
                )

                # ─── Broadcast price update for live chart ────────
                try:
                    await redis.publish(
                        PRICE_UPDATE_CHANNEL,
                        json.dumps({
                            "product_id": product_id,
                            "multiplier": new_state.price_multiplier,
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                        }),
                    )
                except Exception:
                    pass  # fire-and-forget — never block the critical path

                return new_state

        except WatchError:
            # ─── Step 7: Another request modified the key — backoff & retry
            backoff_ms = BASE_BACKOFF_MS * (2 ** attempt)
            logger.warning(
                f"⚠️  WatchError on {product_id} (attempt {attempt + 1}/{MAX_RETRIES}). "
                f"Retrying in {backoff_ms}ms..."
            )
            await asyncio.sleep(backoff_ms / 1000.0)

    raise RuntimeError(
        f"Optimistic lock failed after {MAX_RETRIES} retries for product {product_id}. "
        f"Extreme contention detected."
    )


async def read_price_multiplier(
    redis: aioredis.Redis,
    product_id: str,
) -> float:
    """
    Read the current dynamic price multiplier for a product.
    Returns 1.0 (no adjustment) if not yet calculated.
    """
    raw = await redis.get(_price_key(product_id))
    if raw is None:
        return 1.0
    data = json.loads(raw)
    return float(data.get("multiplier", 1.0))
