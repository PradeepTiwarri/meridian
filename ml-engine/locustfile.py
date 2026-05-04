"""
Meridian — Dynamic Spike & Dip Load Test
=========================================
Simulates realistic Black Friday traffic with alternating SURGE and CALM
phases so the admin dashboard charts show dramatic spikes and dips —
not a flat constant line.

Usage:
  locust -f locustfile.py --host http://localhost:4000

Phase cycle (repeats):
  - SURGE  (20s): Aggressive cart_addition blitz on one product → multiplier climbs
  - CALM   (15s): Light dwell browsing only → multiplier drifts back down
  - SURGE  (20s): Blitz rotates to next product
  - CALM   (15s): ...and so on

This creates the wave pattern visible on the Recharts price chart.
"""

import random
import uuid
import time
import math
from datetime import datetime, timezone
from locust import HttpUser, task, between, events

# ─── Products to cycle through ───────────────────────────────────
TARGET_PRODUCTS = ["prod_001", "prod_002", "prod_003"]
ALL_PRODUCTS = ["prod_001", "prod_002", "prod_003", "prod_004", "prod_005"]

# ─── Phase timing ────────────────────────────────────────────────
SURGE_DURATION = 20   # seconds of aggressive demand
CALM_DURATION  = 15   # seconds of light browsing
CYCLE_LENGTH   = SURGE_DURATION + CALM_DURATION

# Global start time for synchronized phase calculation
START_TIME = time.time()


def iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def is_surge_phase() -> bool:
    """All users share the same phase so demand stacks up together."""
    elapsed = time.time() - START_TIME
    position_in_cycle = elapsed % CYCLE_LENGTH
    return position_in_cycle < SURGE_DURATION


def current_surge_product() -> str:
    """Rotates the target product each cycle so all 3 get spikes."""
    elapsed = time.time() - START_TIME
    cycle_index = int(elapsed // CYCLE_LENGTH)
    return TARGET_PRODUCTS[cycle_index % len(TARGET_PRODUCTS)]


class MeridianTrafficUser(HttpUser):
    """Simulates storefront visitors with alternating surge/calm behavior."""

    wait_time = between(0.1, 0.5)

    def on_start(self):
        self.session_id = str(uuid.uuid4())

    # ── SURGE: Heavy cart additions on the current target product ─────
    @task(6)
    def cart_spike(self):
        if not is_surge_phase():
            # During calm phase, skip this task entirely
            return

        product = current_surge_product()
        self.client.post(
            "/telemetry",
            json={
                "event_type": "cart_addition",
                "timestamp": iso_now(),
                "session_id": self.session_id,
                "payload": {
                    "product_id": product,
                    "quantity": 1,
                },
            },
            name=f"[SURGE] cart → {product}",
        )

    # ── CALM: Light dwell browsing on random products ────────────────
    @task(3)
    def browse_dwell(self):
        product = random.choice(ALL_PRODUCTS)
        dwell = random.randint(5, 90)

        self.client.post(
            "/telemetry",
            json={
                "event_type": "dwell_time_seconds",
                "timestamp": iso_now(),
                "session_id": self.session_id,
                "payload": {
                    "product_id": product,
                    "value": dwell,
                },
            },
            name="[calm] dwell",
        )

    # ── Occasional competitor/inventory sim for variety ───────────────
    @task(1)
    def market_event(self):
        if is_surge_phase():
            # During surge: simulate inventory dropping on the target
            self.client.post(
                "/telemetry",
                json={
                    "event_type": "inventory_drop_sim",
                    "timestamp": iso_now(),
                    "session_id": self.session_id,
                    "payload": {
                        "product_id": current_surge_product(),
                        "units_remaining": random.randint(2, 15),
                    },
                },
                name="[SURGE] inventory_drop",
            )
        else:
            # During calm: competitor undercuts a random product
            self.client.post(
                "/telemetry",
                json={
                    "event_type": "competitor_price_sim",
                    "timestamp": iso_now(),
                    "session_id": self.session_id,
                    "payload": {
                        "product_id": random.choice(ALL_PRODUCTS),
                        "competitor_price": round(random.uniform(50, 150), 2),
                    },
                },
                name="[calm] competitor_price",
            )