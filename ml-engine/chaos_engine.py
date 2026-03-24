"""
Meridian Chaos Engine — Stress Test & Demo Script
===================================================
Generates a continuous, realistic stream of e-commerce telemetry
and POSTs it to the NestJS backend. Designed to make the Admin
Dashboard light up for live demos.

Usage:
    python chaos_engine.py

Requires:
    pip install httpx colorama
"""

from __future__ import annotations

import asyncio
import json
import random
import uuid
from datetime import datetime, timezone

import httpx
from colorama import Fore, Style, init as colorama_init

# =============================================================================
# Configuration
# =============================================================================

TARGET_URL = "http://localhost:4000/telemetry"
NUM_WORKERS = 10

PRODUCTS = ["prod_001", "prod_002", "prod_003", "prod_004", "prod_005"]

PRODUCT_NAMES = {
    "prod_001": "Enterprise API Gateway",
    "prod_002": "Standard Cloud Storage",
    "prod_003": "Dedicated GPU Cluster",
    "prod_004": "Real-Time Data Pipeline",
    "prod_005": "ML Inference Platform",
}

# Base prices in cents (matching config.py)
BASE_PRICES = {
    "prod_001": 249900,
    "prod_002": 89900,
    "prod_003": 1299900,
    "prod_004": 179900,
    "prod_005": 349900,
}

# Event types with realistic distribution weights
EVENT_TYPES = [
    "dwell_time_seconds",   # 50% — browsing
    "page_view",            # 25% — passive views
    "cart_addition",        # 15% — buying signal
    "competitor_price_sim", #  7% — market shift
    "inventory_drop_sim",   #  3% — supply shock
]
EVENT_WEIGHTS = [50, 25, 15, 7, 3]

# Terminal color mapping per event type
EVENT_COLORS = {
    "dwell_time_seconds":   Fore.CYAN,
    "page_view":            Fore.WHITE,
    "cart_addition":        Fore.GREEN,
    "competitor_price_sim": Fore.YELLOW,
    "inventory_drop_sim":   Fore.RED,
}

EVENT_ICONS = {
    "dwell_time_seconds":   "👁️  DWELL",
    "page_view":            "📄 VIEW ",
    "cart_addition":        "🛒 CART ",
    "competitor_price_sim": "⚔️  COMP ",
    "inventory_drop_sim":   "📦 STOCK",
}


# =============================================================================
# Payload Generator
# =============================================================================

def generate_event() -> dict:
    """
    Build a valid telemetry payload matching the NestJS CreateTelemetryDto.

    Structure:
        {
            "event_type": "...",
            "session_id": "uuid-v4",
            "timestamp": "ISO-8601",
            "payload": { ... event-specific data }
        }
    """
    event_type = random.choices(EVENT_TYPES, weights=EVENT_WEIGHTS, k=1)[0]
    product_id = random.choice(PRODUCTS)

    payload: dict = {}
    detail = ""

    if event_type == "dwell_time_seconds":
        seconds = random.randint(1, 120)
        payload = {"product_id": product_id, "seconds": seconds}
        detail = f"{PRODUCT_NAMES[product_id]} — {seconds}s hover"

    elif event_type == "page_view":
        payload = {}
        detail = "catalog page"

    elif event_type == "cart_addition":
        payload = {"product_id": product_id}
        detail = f"{PRODUCT_NAMES[product_id]}"

    elif event_type == "competitor_price_sim":
        base = BASE_PRICES[product_id]
        # Competitor drops price by 5-20%
        drop_pct = random.uniform(0.05, 0.20)
        comp_price = int(base * (1 - drop_pct))
        payload = {
            "affected_product_id": product_id,
            "competitor_price": comp_price,
        }
        detail = f"{PRODUCT_NAMES[product_id]} — rival @ -{drop_pct:.0%}"

    elif event_type == "inventory_drop_sim":
        stock = random.randint(0, 15)
        payload = {
            "product_id": product_id,
            "stock_remaining": stock,
        }
        detail = f"{PRODUCT_NAMES[product_id]} — {stock} units left"

    return {
        "event": {
            "event_type": event_type,
            "session_id": str(uuid.uuid4()),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "payload": payload,
        },
        "detail": detail,
    }


# =============================================================================
# Async Worker
# =============================================================================

async def worker(client: httpx.AsyncClient, worker_id: int) -> None:
    """
    Continuously generates and sends telemetry events.
    Each worker runs in its own coroutine for high concurrency.
    """
    sent = 0

    while True:
        try:
            data = generate_event()
            event = data["event"]
            detail = data["detail"]
            event_type = event["event_type"]

            res = await client.post(TARGET_URL, json=event, timeout=5.0)

            sent += 1
            color = EVENT_COLORS.get(event_type, Fore.WHITE)
            icon = EVENT_ICONS.get(event_type, "     ")
            status = f"{Fore.GREEN}✓{Style.RESET_ALL}" if res.status_code < 300 else f"{Fore.RED}✗ {res.status_code}{Style.RESET_ALL}"

            print(
                f"  {Fore.BLUE}W{worker_id:02d}{Style.RESET_ALL} "
                f"{color}{icon}{Style.RESET_ALL} "
                f"{status} "
                f"{Fore.LIGHTBLACK_EX}{detail}{Style.RESET_ALL}"
            )

        except httpx.ConnectError:
            print(
                f"  {Fore.RED}W{worker_id:02d} ✗ Connection refused — "
                f"is the backend running on {TARGET_URL}?{Style.RESET_ALL}"
            )
            await asyncio.sleep(3.0)
            continue

        except Exception as e:
            print(
                f"  {Fore.RED}W{worker_id:02d} ✗ Error: {e}{Style.RESET_ALL}"
            )

        # Pace: 0.1–0.8s between events per worker
        await asyncio.sleep(random.uniform(0.1, 0.8))


# =============================================================================
# Main
# =============================================================================

async def main() -> None:
    """Launch all workers with a shared HTTP client."""
    colorama_init(autoreset=True)

    print()
    print(f"  {Fore.CYAN}{'═' * 56}{Style.RESET_ALL}")
    print(f"  {Fore.CYAN}  ⚡  MERIDIAN CHAOS ENGINE  ⚡{Style.RESET_ALL}")
    print(f"  {Fore.CYAN}{'═' * 56}{Style.RESET_ALL}")
    print()
    print(f"  Target:      {Fore.WHITE}{TARGET_URL}{Style.RESET_ALL}")
    print(f"  Workers:     {Fore.WHITE}{NUM_WORKERS}{Style.RESET_ALL}")
    print(f"  Products:    {Fore.WHITE}{len(PRODUCTS)}{Style.RESET_ALL}")
    print()
    print(f"  {Fore.CYAN}Event Distribution:{Style.RESET_ALL}")
    for et, w in zip(EVENT_TYPES, EVENT_WEIGHTS):
        color = EVENT_COLORS[et]
        icon = EVENT_ICONS[et]
        print(f"    {color}{icon}  {w:>2}%{Style.RESET_ALL}")
    print()
    print(f"  {Fore.GREEN}Starting {NUM_WORKERS} workers...{Style.RESET_ALL}")
    print(f"  {Fore.LIGHTBLACK_EX}Press Ctrl+C to stop.{Style.RESET_ALL}")
    print()

    async with httpx.AsyncClient() as client:
        tasks = [worker(client, i) for i in range(NUM_WORKERS)]
        try:
            await asyncio.gather(*tasks)
        except asyncio.CancelledError:
            pass


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print(f"\n  {Fore.YELLOW}⚡ Chaos Engine stopped.{Style.RESET_ALL}\n")
