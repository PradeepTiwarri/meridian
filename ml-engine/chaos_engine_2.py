"""
Meridian Chaos Engine 2 — Boom & Bust Market Simulator + Benchmarks
====================================================================
Time-phased stress test that alternates between extreme upward
pressure (Viral Demand) and downward pressure (Competitor War)
every 15 seconds.

On Ctrl+C, prints a full performance report with RPS, P95, P99.

Usage:
    python chaos_engine_2.py

Requires:
    pip install httpx colorama
"""

from __future__ import annotations

import atexit
import asyncio
import os
import random
import signal
import statistics
import time
import uuid
from datetime import datetime, timezone
from threading import Lock

import httpx
from colorama import Fore, Style, init as colorama_init

# =============================================================================
# Configuration
# =============================================================================

TARGET_URL = "http://localhost:4000/telemetry"
NUM_WORKERS = 10
PHASE_DURATION_S = 15  # Switch phases every 15 seconds

PRODUCTS = ["prod_001", "prod_002", "prod_003", "prod_004", "prod_005"]

PRODUCT_NAMES = {
    "prod_001": "Enterprise API Gateway",
    "prod_002": "Standard Cloud Storage",
    "prod_003": "Dedicated GPU Cluster",
    "prod_004": "Real-Time Data Pipeline",
    "prod_005": "ML Inference Platform",
}

BASE_PRICES = {
    "prod_001": 249900,
    "prod_002": 89900,
    "prod_003": 1299900,
    "prod_004": 179900,
    "prod_005": 349900,
}

# =============================================================================
# Phase definitions
# =============================================================================

PHASE_VIRAL = "VIRAL DEMAND"
PHASE_WAR   = "COMPETITOR WAR"

VIRAL_EVENTS  = ["cart_addition", "inventory_drop_sim", "page_view"]
VIRAL_WEIGHTS = [60, 15, 25]

WAR_EVENTS  = ["competitor_price_sim", "dwell_time_seconds", "page_view"]
WAR_WEIGHTS = [30, 50, 20]

PHASE_COLORS = {
    PHASE_VIRAL: Fore.GREEN,
    PHASE_WAR:   Fore.RED,
}

EVENT_ICONS = {
    "cart_addition":        f"{Fore.GREEN}🛒 CART {Style.RESET_ALL}",
    "inventory_drop_sim":   f"{Fore.RED}📦 STOCK{Style.RESET_ALL}",
    "page_view":            f"{Fore.WHITE}📄 VIEW {Style.RESET_ALL}",
    "competitor_price_sim": f"{Fore.YELLOW}⚔️  COMP {Style.RESET_ALL}",
    "dwell_time_seconds":   f"{Fore.CYAN}👁️  DWELL{Style.RESET_ALL}",
}


# =============================================================================
# Metrics Collector (thread-safe)
# =============================================================================

class Metrics:
    def __init__(self) -> None:
        self._lock = Lock()
        self.total_requests = 0
        self.successful_requests = 0
        self.failed_requests = 0
        self.latencies: list[float] = []  # milliseconds
        self.start_time = time.perf_counter()
        self._reported = False

    def record(self, latency_ms: float, success: bool) -> None:
        with self._lock:
            self.total_requests += 1
            if success:
                self.successful_requests += 1
            else:
                self.failed_requests += 1
            self.latencies.append(latency_ms)

    def report(self) -> None:
        # Guard: only print the report once
        if self._reported:
            return
        self._reported = True

        elapsed = time.perf_counter() - self.start_time

        with self._lock:
            total = self.total_requests
            success = self.successful_requests
            failed = self.failed_requests
            lats = sorted(self.latencies) if self.latencies else []

        if not lats:
            print(f"\n  {Fore.YELLOW}No requests recorded.{Style.RESET_ALL}\n")
            return

        rps = total / elapsed if elapsed > 0 else 0
        avg_lat = statistics.mean(lats)
        p50 = lats[int(len(lats) * 0.50)]
        p95 = lats[int(len(lats) * 0.95)]
        p99 = lats[int(len(lats) * 0.99)]
        min_lat = lats[0]
        max_lat = lats[-1]
        error_rate = (failed / total * 100) if total > 0 else 0

        W = Fore.WHITE
        C = Fore.CYAN
        G = Fore.GREEN
        Y = Fore.YELLOW
        R = Fore.RED
        D = Fore.LIGHTBLACK_EX
        S = Style.RESET_ALL

        print()
        print(f"  {C}{'═' * 56}{S}")
        print(f"  {C}  📊  PERFORMANCE REPORT{S}")
        print(f"  {C}{'═' * 56}{S}")
        print()
        print(f"  {D}Duration{S}         {W}{elapsed:>10.1f}s{S}")
        print(f"  {D}Total Requests{S}   {W}{total:>10,}{S}")
        print(f"  {D}Successful{S}       {G}{success:>10,}{S}")
        print(f"  {D}Failed{S}           {R}{failed:>10,}{S}")
        print()
        print(f"  {C}── Throughput ──────────────────────────────{S}")
        print(f"  {D}Requests/sec{S}     {Y}{rps:>10.1f} RPS{S}")
        print()
        print(f"  {C}── Latency (ms) ───────────────────────────{S}")
        print(f"  {D}Min{S}              {W}{min_lat:>10.1f} ms{S}")
        print(f"  {D}Avg{S}              {W}{avg_lat:>10.1f} ms{S}")
        print(f"  {D}P50{S}              {W}{p50:>10.1f} ms{S}")
        print(f"  {D}P95{S}              {Y}{p95:>10.1f} ms{S}")
        print(f"  {D}P99{S}              {R}{p99:>10.1f} ms{S}")
        print(f"  {D}Max{S}              {R}{max_lat:>10.1f} ms{S}")
        print()
        print(f"  {C}── Reliability ────────────────────────────{S}")
        error_color = G if error_rate < 1 else (Y if error_rate < 5 else R)
        print(f"  {D}Error Rate{S}       {error_color}{error_rate:>9.2f}%{S}")
        success_rate = 100 - error_rate
        print(f"  {D}Success Rate{S}     {G}{success_rate:>9.2f}%{S}")
        print()
        print(f"  {C}{'═' * 56}{S}")
        print()


metrics = Metrics()

# Register atexit — this ALWAYS runs on exit, even on Windows Ctrl+C
atexit.register(metrics.report)


# =============================================================================
# SIGINT handler — works on Windows where KeyboardInterrupt may not fire
# =============================================================================

def _handle_sigint(sig: int, frame: object) -> None:
    """Print report and exit immediately on Ctrl+C."""
    metrics.report()
    print(f"  {Fore.YELLOW}⚡ Chaos Engine 2 stopped.{Style.RESET_ALL}\n")
    os._exit(0)


signal.signal(signal.SIGINT, _handle_sigint)


# =============================================================================
# Phase resolver
# =============================================================================

START_TIME = time.time()


def get_current_phase() -> str:
    elapsed = time.time() - START_TIME
    cycle = int(elapsed // PHASE_DURATION_S)
    return PHASE_VIRAL if cycle % 2 == 0 else PHASE_WAR


# =============================================================================
# Payload Generator
# =============================================================================

def generate_event() -> dict:
    phase = get_current_phase()
    product_id = random.choice(PRODUCTS)

    if phase == PHASE_VIRAL:
        event_type = random.choices(VIRAL_EVENTS, weights=VIRAL_WEIGHTS, k=1)[0]
    else:
        event_type = random.choices(WAR_EVENTS, weights=WAR_WEIGHTS, k=1)[0]

    payload: dict = {}
    detail = ""

    if event_type == "cart_addition":
        payload = {"product_id": product_id}
        detail = f"{PRODUCT_NAMES[product_id]}"

    elif event_type == "inventory_drop_sim":
        stock = random.randint(0, 5)
        payload = {"product_id": product_id, "stock_remaining": stock}
        detail = f"{PRODUCT_NAMES[product_id]} — {stock} units left"

    elif event_type == "page_view":
        payload = {}
        detail = "catalog page"

    elif event_type == "competitor_price_sim":
        base = BASE_PRICES[product_id]
        drop_pct = random.uniform(0.10, 0.20)
        comp_price = int(base * (1 - drop_pct))
        payload = {
            "affected_product_id": product_id,
            "competitor_price": comp_price,
        }
        detail = f"{PRODUCT_NAMES[product_id]} — rival @ -{drop_pct:.0%}"

    elif event_type == "dwell_time_seconds":
        seconds = random.randint(30, 120)
        payload = {"product_id": product_id, "seconds": seconds}
        detail = f"{PRODUCT_NAMES[product_id]} — {seconds}s hover"

    return {
        "event": {
            "event_type": event_type,
            "session_id": str(uuid.uuid4()),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "payload": payload,
        },
        "phase": phase,
        "detail": detail,
    }


# =============================================================================
# Async Worker
# =============================================================================

async def worker(client: httpx.AsyncClient, worker_id: int) -> None:
    last_phase = ""

    while True:
        try:
            data = generate_event()
            event = data["event"]
            phase = data["phase"]
            detail = data["detail"]
            event_type = event["event_type"]

            # Announce phase transitions
            if phase != last_phase:
                phase_color = PHASE_COLORS[phase]
                if worker_id == 0:
                    print(f"\n  {phase_color}{'━' * 56}{Style.RESET_ALL}")
                    print(f"  {phase_color}  ▶  PHASE: {phase}  ◀{Style.RESET_ALL}")
                    print(f"  {phase_color}{'━' * 56}{Style.RESET_ALL}\n")
                last_phase = phase

            # ─── Latency measurement ─────────────────────────
            t0 = time.perf_counter()
            res = await client.post(TARGET_URL, json=event, timeout=5.0)
            latency_ms = (time.perf_counter() - t0) * 1000

            success = res.status_code < 300
            metrics.record(latency_ms, success)

            icon = EVENT_ICONS.get(event_type, "     ")
            phase_color = PHASE_COLORS[phase]
            status = (
                f"{Fore.GREEN}✓{Style.RESET_ALL}"
                if success
                else f"{Fore.RED}✗ {res.status_code}{Style.RESET_ALL}"
            )
            lat_color = Fore.GREEN if latency_ms < 50 else (Fore.YELLOW if latency_ms < 200 else Fore.RED)

            print(
                f"  {Fore.BLUE}W{worker_id:02d}{Style.RESET_ALL} "
                f"{phase_color}[{phase[:5]}]{Style.RESET_ALL} "
                f"{icon} {status} "
                f"{lat_color}{latency_ms:>6.1f}ms{Style.RESET_ALL} "
                f"{Fore.LIGHTBLACK_EX}{detail}{Style.RESET_ALL}"
            )

        except httpx.ConnectError:
            metrics.record(0, False)
            print(
                f"  {Fore.RED}W{worker_id:02d} ✗ Connection refused — "
                f"is the backend running on {TARGET_URL}?{Style.RESET_ALL}"
            )
            await asyncio.sleep(3.0)
            continue

        except Exception as e:
            metrics.record(0, False)
            print(f"  {Fore.RED}W{worker_id:02d} ✗ Error: {e}{Style.RESET_ALL}")

        await asyncio.sleep(random.uniform(0.1, 0.5))


# =============================================================================
# Main
# =============================================================================

async def main() -> None:
    colorama_init(autoreset=True)

    print()
    print(f"  {Fore.MAGENTA}{'═' * 56}{Style.RESET_ALL}")
    print(f"  {Fore.MAGENTA}  ⚡  MERIDIAN CHAOS ENGINE 2 — BOOM & BUST  ⚡{Style.RESET_ALL}")
    print(f"  {Fore.MAGENTA}{'═' * 56}{Style.RESET_ALL}")
    print()
    print(f"  Target:      {Fore.WHITE}{TARGET_URL}{Style.RESET_ALL}")
    print(f"  Workers:     {Fore.WHITE}{NUM_WORKERS}{Style.RESET_ALL}")
    print(f"  Phase Timer: {Fore.WHITE}{PHASE_DURATION_S}s per phase{Style.RESET_ALL}")
    print()
    print(f"  {Fore.GREEN}Phase 1 — VIRAL DEMAND{Style.RESET_ALL}  (60% carts, 15% stock drops)")
    print(f"  {Fore.RED}Phase 2 — COMPETITOR WAR{Style.RESET_ALL} (30% comp drops, 50% dwell)")
    print()
    print(f"  {Fore.GREEN}Starting {NUM_WORKERS} workers...{Style.RESET_ALL}")
    print(f"  {Fore.LIGHTBLACK_EX}Press Ctrl+C to stop and see the performance report.{Style.RESET_ALL}")
    print()

    global START_TIME
    START_TIME = time.time()
    metrics.start_time = time.perf_counter()

    async with httpx.AsyncClient() as client:
        tasks = [worker(client, i) for i in range(NUM_WORKERS)]
        await asyncio.gather(*tasks)


if __name__ == "__main__":
    asyncio.run(main())
