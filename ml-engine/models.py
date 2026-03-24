"""
Meridian ML Engine — Pydantic Models
======================================
Strict payload validation matching the NestJS CreateTelemetryDto envelope.
"""

from __future__ import annotations
from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field


# =============================================================================
# Telemetry Payload (matches NestJS DTO exactly)
# =============================================================================

class TelemetryPayload(BaseModel):
    """
    Envelope for all telemetry events from the Next.js storefront.
    Validated by NestJS before reaching this service (via POST /ingest)
    or received raw via Redis Pub/Sub.
    """
    event_type: str = Field(
        ...,
        description="Event type: page_view, dwell_time_seconds, "
                    "cart_addition, competitor_price_sim, inventory_drop_sim",
    )
    session_id: str = Field(..., description="UUID v4 session identifier")
    timestamp: str = Field(..., description="ISO-8601 timestamp")
    payload: dict[str, Any] = Field(
        default_factory=dict,
        description="Event-specific data",
    )

    @property
    def parsed_timestamp(self) -> datetime:
        """Parse the ISO-8601 timestamp string."""
        return datetime.fromisoformat(self.timestamp.replace("Z", "+00:00"))


# =============================================================================
# Feature Vector (input to the River model)
# =============================================================================

class FeatureVector(BaseModel):
    """
    The continuous state vector fed into the HoeffdingTreeRegressor.
    Engineered from raw telemetry events + Redis product state.
    """
    time_of_day_hour: float      # 0-23
    current_stock_level: float   # units remaining
    recent_views_velocity: float # view/cart events in rolling window
    competitor_price_ratio: float # our_base_price / competitor_price

    # One-hot encoded event type — lets the tree differentiate events
    is_cart_addition: float = 0.0
    is_competitor_sim: float = 0.0
    is_inventory_drop: float = 0.0
    is_dwell_time: float = 0.0

    def to_dict(self) -> dict[str, float]:
        return self.model_dump()


# =============================================================================
# Product State (stored in Redis as JSON)
# =============================================================================

class ProductState(BaseModel):
    """
    Persisted per-product state in Redis at key `product_state:{product_id}`.
    Updated atomically via WATCH/MULTI/EXEC.
    """
    product_id: str
    stock_level: int = 100          # default starting stock
    recent_views: int = 0           # rolling view count
    last_competitor_price: int = 0  # last known competitor price (cents)
    price_multiplier: float = 1.0   # current dynamic multiplier
    updated_at: str = ""            # ISO timestamp of last update


# =============================================================================
# Ingestion Response
# =============================================================================

class IngestResponse(BaseModel):
    status: str = "accepted"
    message: str = "Event queued for ML processing"
