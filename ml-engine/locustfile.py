"""
Meridian — Targeted Anomaly Load Test
======================================
Hammers a single product (MRD-APG-001) with cart_addition events
to spike the demand multiplier past 1.10 and trigger the RevOps agent.

Usage:
  locust -f locustfile.py --host http://localhost:4000 --users 50 --spawn-rate 10 --headless -t 2m
"""

from locust import HttpUser, task, between


class DemandSpikeUser(HttpUser):
    wait_time = between(0.1, 0.5)

    @task
    def fire_cart_addition(self):
        self.client.post(
            "/api/telemetry",
            json={
                "event_type": "cart_addition",
                "product_id": "MRD-APG-001",
            },
            headers={"Content-Type": "application/json"},
        )
