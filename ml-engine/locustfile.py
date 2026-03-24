"""
Meridian Load Tester — Locust Configuration
=============================================
Enterprise load-testing script using FastHttpUser.

Usage:
    locust                           # then open http://localhost:8089
    locust --headless -u 500 -r 50   # headless mode, 500 users, 50/s spawn

Requires:
    pip install locust
"""

from __future__ import annotations

import random
import uuid
from datetime import datetime, timezone

from locust import task, between, FastHttpUser


# =============================================================================
# Configuration
# =============================================================================

PRODUCTS = ["prod_001", "prod_002", "prod_003", "prod_004", "prod_005"]

BASE_PRICES = {
    "prod_001": 249900,
    "prod_002": 89900,
    "prod_003": 1299900,
    "prod_004": 179900,
    "prod_005": 349900,
}

# Event types and weights (mixed market pressure)
EVENT_TYPES = [
    "page_view",
    "cart_addition",
    "competitor_price_sim",
    "dwell_time_seconds",
    "inventory_drop_sim",
]
EVENT_WEIGHTS = [25, 30, 15, 20, 10]


# =============================================================================
# Payload Generator (ported from chaos_engine_2.py)
# =============================================================================

def generate_telemetry_payload() -> dict:
    """Generate a realistic telemetry event payload."""
    event_type = random.choices(EVENT_TYPES, weights=EVENT_WEIGHTS, k=1)[0]
    product_id = random.choice(PRODUCTS)

    payload: dict = {}

    if event_type == "page_view":
        payload = {}

    elif event_type == "cart_addition":
        payload = {"product_id": product_id}

    elif event_type == "competitor_price_sim":
        base = BASE_PRICES[product_id]
        drop_pct = random.uniform(0.10, 0.20)
        comp_price = int(base * (1 - drop_pct))
        payload = {
            "affected_product_id": product_id,
            "competitor_price": comp_price,
        }

    elif event_type == "dwell_time_seconds":
        seconds = random.randint(5, 120)
        payload = {"product_id": product_id, "seconds": seconds}

    elif event_type == "inventory_drop_sim":
        stock = random.randint(0, 10)
        payload = {"product_id": product_id, "stock_remaining": stock}

    return {
        "event_type": event_type,
        "session_id": str(uuid.uuid4()),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "payload": payload,
    }


# =============================================================================
# Locust User
# =============================================================================

class MeridianUser(FastHttpUser):
    """
    Simulates a user generating telemetry events against the NestJS backend.

    Configure via Locust UI:
      - Host: http://localhost:4000
      - Users: 500
      - Spawn rate: 50/s
    """

    wait_time = between(0.1, 1.0)

    @task
    def send_telemetry(self) -> None:
        """POST a random telemetry event to /telemetry."""
        event = generate_telemetry_payload()
        self.client.post(
            "/telemetry",
            json=event,
            headers={"Content-Type": "application/json"},
        )
