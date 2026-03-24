"""
Meridian ML Engine — Feature Engineering
==========================================
Converts isolated telemetry events into a continuous state vector
that the River model can learn from and predict on.
"""

from __future__ import annotations

import logging
from datetime import datetime

import redis.asyncio as aioredis

from config import settings
from models import TelemetryPayload, FeatureVector, ProductState

logger = logging.getLogger("meridian.features")

# Rolling window key for view velocity tracking
VIEWS_KEY = "views_velocity:{product_id}"
VIEWS_WINDOW_SECONDS = 300  # 5-minute rolling window


def extract_product_id(event: TelemetryPayload) -> str | None:
    """
    Extract the product_id from a telemetry event payload.
    Returns None if the event doesn't relate to a specific product.
    """
    payload = event.payload

    if event.event_type == "cart_addition":
        return payload.get("product_id")
    elif event.event_type == "competitor_price_sim":
        return payload.get("affected_product_id")
    elif event.event_type == "inventory_drop_sim":
        return payload.get("product_id")
    elif event.event_type == "dwell_time_seconds":
        # Now product-specific — frontend sends product_id on hover
        return payload.get("product_id")
    elif event.event_type == "page_view":
        return None

    return None


async def update_views_velocity(
    redis_client: aioredis.Redis,
    product_id: str,
) -> int:
    """
    Increment and return the view/interaction count in a rolling window.
    Uses a Redis key with TTL for automatic expiry.
    """
    key = VIEWS_KEY.format(product_id=product_id)
    count = await redis_client.incr(key)

    # Set TTL only on first increment (when count == 1)
    if count == 1:
        await redis_client.expire(key, VIEWS_WINDOW_SECONDS)

    return count


async def build_features(
    redis_client: aioredis.Redis,
    event: TelemetryPayload,
    state: ProductState,
) -> FeatureVector:
    """
    Build the feature vector from the event + current product state.

    Features:
      1. time_of_day_hour  — hour (0-23) from event timestamp
      2. current_stock_level — from Redis product state
      3. recent_views_velocity — rolling window count
      4. competitor_price_ratio — our_base / competitor_price (or 1.0)
    """
    product_id = state.product_id

    # 1. Time of day
    try:
        ts = event.parsed_timestamp
        time_of_day = float(ts.hour + ts.minute / 60.0)
    except Exception:
        time_of_day = float(datetime.utcnow().hour)

    # 2. Current stock level
    stock_level = float(state.stock_level)

    # 3. Views velocity (rolling window)
    views = await update_views_velocity(redis_client, product_id)

    # 4. Competitor price ratio
    base_price = settings.base_prices.get(product_id, 100_000)
    competitor_price = state.last_competitor_price
    if competitor_price > 0:
        ratio = base_price / competitor_price
    else:
        ratio = 1.0  # No competitor data yet

    # 5. One-hot encode event type
    is_cart = 1.0 if event.event_type == "cart_addition" else 0.0
    is_comp = 1.0 if event.event_type == "competitor_price_sim" else 0.0
    is_inv = 1.0 if event.event_type == "inventory_drop_sim" else 0.0
    is_dwell = 1.0 if event.event_type == "dwell_time_seconds" else 0.0

    features = FeatureVector(
        time_of_day_hour=time_of_day,
        current_stock_level=stock_level,
        recent_views_velocity=float(views),
        competitor_price_ratio=ratio,
        is_cart_addition=is_cart,
        is_competitor_sim=is_comp,
        is_inventory_drop=is_inv,
        is_dwell_time=is_dwell,
    )

    logger.debug(
        f"Features for {product_id}: hour={time_of_day:.1f} "
        f"stock={stock_level} views={views} ratio={ratio:.3f} "
        f"type={event.event_type}"
    )

    return features


def compute_target_multiplier(
    event: TelemetryPayload,
    state: ProductState,
) -> float:
    """
    Delta-based target multiplier for online learning.

    Instead of returning absolute values (1.15, 0.95) which cause price
    jumps, we nudge from the current multiplier to create smooth,
    continuous market curves.

    Nudge magnitudes:
      - cart_addition:        +0.03 to +0.05 (demand → raise)
      - competitor cheaper:   -0.04 (compete → lower)
      - competitor pricier:   +0.02 (hold/raise)
      - inventory scarcity:   +0.03 to +0.06 (scarcity → raise)
      - dwell_time (no buy):  -0.01 to -0.02 (browsing → slight lower)
      - default:               0.00 (no change)
    """
    current = state.price_multiplier
    event_type = event.event_type
    payload = event.payload

    if event_type == "cart_addition":
        # Demand signal — nudge up
        return current + 0.05

    elif event_type == "competitor_price_sim":
        base = settings.base_prices.get(state.product_id, 100_000)
        comp_price = payload.get("competitor_price", base)
        if comp_price < base:
            # Aggressive 15% nudge to overcome EMA inertia
            return current - 0.15
        return current + 0.02      # We're already cheaper → hold/raise

    elif event_type == "inventory_drop_sim":
        # Scarcity signal — strong nudge up
        return current + 0.10

    elif event_type == "dwell_time_seconds":
        # Slow decay for browsing-without-buying
        return current - 0.02

    return current  # Default: no change
