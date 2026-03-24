# 🌐 Meridian — Autonomous Revenue Operations Engine

> A production-grade, full-stack ecosystem that uses **real-time ML inference** to dynamically price B2B SaaS products based on live market telemetry — with autonomous AI governance via a LangChain RevOps Auditor.

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Next.js 15](https://img.shields.io/badge/Next.js_15-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis&logoColor=white)](https://redis.io/)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)](https://python.org/)
[![River ML](https://img.shields.io/badge/River-Online_ML-blue)](https://riverml.xyz/)
[![LangChain](https://img.shields.io/badge/LangChain-RAG_Agent-green)](https://langchain.com/)

---

## 📊 Production Performance (Verified via Locust)

| Metric | Value |
|---|---|
| **Throughput** | **868 RPS** under 500 concurrent users |
| **Total Events Processed** | 738,000+ |
| **Ingestion Latency (P50)** | 12ms |
| **Ingestion Latency (P99)** | 120ms |
| **ML Processing Time** | ~18ms/event |
| **Error Rate** | **0%** under massive transaction collisions |
| **Redis Footprint** | ~12MB RAM, 12% CPU under load |

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        NEXT.JS 15 FRONTEND                          │
│  ┌─────────────────┐  ┌──────────────────────────────────────────┐  │
│  │   B2B Storefront │  │     Admin Command Center (Real-Time)    │  │
│  │   • Product Grid │  │  • Synced Price + Traffic Charts        │  │
│  │   • Dynamic Cart │  │  • Market Telemetry Feed                │  │
│  │   • Checkout     │  │  • RevOps Agent Terminal (CoT Viewer)   │  │
│  │                  │  │  • Manual Price Override Panel          │  │
│  │                  │  │  • Product Filter Bar (Toggle/Filter)   │  │
│  └────────┬─────────┘  └──────────────────┬───────────────────────┘ │
│           │                               │ WebSocket (Socket.IO)   │
└───────────┼───────────────────────────────┼─────────────────────────┘
            │ REST API                      │
┌───────────▼───────────────────────────────▼─────────────────────────┐
│                      NESTJS API GATEWAY                             │
│  ┌───────────────┐  ┌────────────────┐  ┌────────────────────────┐  │
│  │  /telemetry   │  │  /checkout     │  │  /admin/override       │  │
│  │  Ingestion    │  │  Dynamic       │  │  Manual Price Lock     │  │
│  │  + Pub/Sub    │  │  Pricing       │  │  + Redis + WebSocket   │  │
│  │  Broadcast    │  │  Interceptor   │  │  Force Publish         │  │
│  └───────┬───────┘  └───────┬────────┘  └────────┬───────────────┘  │
└──────────┼──────────────────┼─────────────────────┼─────────────────┘
           │ HTTP POST        │ GET key             │ SET + PUBLISH
┌──────────▼──────────────────▼─────────────────────▼─────────────────┐
│                      REDIS (State + Pub/Sub)                        │
│                                                                     │
│  state:{product_id}  → JSON (multiplier, stock, views, timestamp)  │
│  override:{product_id} → locked multiplier (admin override)        │
│  dynamic_price:{product_id} → current multiplier for checkout      │
│  meridian_price_updates → Pub/Sub channel for real-time broadcast  │
│                                                                     │
│  Concurrency: Optimistic Locking (WATCH / MULTI / EXEC)            │
│  Retry Strategy: Exponential backoff with jitter                    │
└──────────┬──────────────────────────────────────────────────────────┘
           │ Pub/Sub subscribe
┌──────────▼──────────────────────────────────────────────────────────┐
│                   FASTAPI ML ENGINE (Python 3.11)                    │
│                                                                     │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌────────────────┐  │
│  │ Ingest   │  │ Feature Eng  │  │ River ML │  │ RevOps Auditor │  │
│  │ POST     │→ │ • Demand     │→ │ Adaptive │→ │ LangChain +    │  │
│  │ /ingest  │  │ • Inventory  │  │ Random   │  │ Llama 3 (Groq) │  │
│  │ 202 async│  │ • Competitor │  │ Forest   │  │ Supabase RAG   │  │
│  │          │  │ • Dwell Time │  │ + EMA    │  │ pgvector       │  │
│  └──────────┘  └──────────────┘  └──────────┘  └────────────────┘  │
│                                                                     │
│  Pipeline: extract → features → target → learn_one → predict_one   │
│  Smoothing: EMA (α=0.3) prevents price oscillation                 │
│  Bounds: 0.85x – 1.30x (max 15% discount, 30% premium)            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🧠 How It Works

### The Pricing Pipeline (per event, ~18ms)

1. **Telemetry Ingestion** — Storefront user actions (`page_view`, `cart_addition`, `dwell_time`, `competitor_price_sim`, `inventory_drop`) are captured and POSTed to the NestJS Gateway.

2. **Async Fanout** — NestJS returns `202 Accepted` instantly, publishes to Redis Pub/Sub, and forwards to the ML Engine.

3. **Feature Engineering** — The ML Engine extracts product-specific features: demand signals, stock pressure, competitor deltas, and engagement decay.

4. **Online Learning** — A River `ARFRegressor` (Adaptive Random Forest, 10 trees) incrementally trains on every event via `learn_one()` — no batch retraining needed.

5. **EMA Smoothing** — Raw model predictions are blended with the current price via Exponential Moving Average (α=0.3), preventing violent oscillations.

6. **RevOps Audit** — For severe price swings (>5% shift), a LangChain agent powered by Llama 3 (via Groq) queries corporate revenue playbooks stored in Supabase pgvector (RAG) and issues `APPROVE` or `OVERRIDE` decisions.

7. **Atomic Commit** — The new multiplier is written to Redis using `WATCH/MULTI/EXEC` optimistic locking with exponential backoff, ensuring zero data corruption under 868+ RPS.

8. **Real-Time Broadcast** — Updated prices propagate via Redis Pub/Sub → NestJS WebSockets → Admin Dashboard charts within ~50ms of the original event.

### The Admin Command Center

- **Synchronized Charts** — `DynamicPriceChart` (line) and `TrafficVolumeChart` (bar) share a global product filter with toggleable pills per product.
- **Live Session History** — 500-tick rolling window with optimized Recharts rendering (`dot={false}`, `isAnimationActive={false}`, `minTickGap={50}`).
- **RevOps Agent Terminal** — Displays the full Chain-of-Thought reasoning of the LangChain auditor in real-time (TRIGGER → RETRIEVAL → REASONING → DECISION).
- **Manual Override Panel** — Admins can lock any product's price multiplier, instantly overriding the ML system. Locked prices bypass the ML pipeline and take effect within 1 WebSocket frame.

---

## 🔧 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | Next.js 15, React 19, Recharts, Tailwind CSS | Storefront + Admin Dashboard |
| **API Gateway** | NestJS, Socket.IO, Class-Validator | REST API, WebSockets, Telemetry Ingestion |
| **State & Messaging** | Redis 7 (Pub/Sub, Optimistic Locking) | Real-time state, price broadcast, override keys |
| **ML Engine** | FastAPI, Python 3.11, River (ARFRegressor) | Online learning, feature engineering, EMA smoothing |
| **AI Governance** | LangChain, Llama 3 (Groq), Supabase pgvector | RAG-based autonomous price auditing |
| **Load Testing** | Locust (FastHttpUser), Custom Chaos Engines | 500-user stress testing, boom/bust simulation |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- Redis Server (local or Docker)

### 1. Backend (NestJS)

```bash
cd backend
npm install
npm run start:dev
# → http://localhost:4000
```

### 2. ML Engine (FastAPI)

```bash
cd ml-engine
python -m venv venv
.\venv\Scripts\Activate.ps1       # Windows
source venv/bin/activate           # macOS/Linux
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000
# → http://localhost:8000
```

### 3. Frontend (Next.js)

```bash
cd storefront
npm install
npm run dev
# → http://localhost:3000
# → Admin Dashboard: http://localhost:3000/admin
```

### 4. Load Testing

```bash
cd ml-engine

# Option A: Chaos Engine (Boom & Bust simulator)
python chaos_engine_2.py

# Option B: Locust (Enterprise load testing with web UI)
.\venv\Scripts\locust.exe
# → Open http://localhost:8089
# → Host: http://localhost:4000, Users: 500, Spawn Rate: 50
```

---

## 📈 Load Testing Results

### Chaos Engine 2 — Boom & Bust Market Simulator

Alternates between **Viral Demand** (60% carts, 15% stock drops → prices UP) and **Competitor War** (30% comp drops, 50% dwell → prices DOWN) every 15 seconds. Includes per-request latency tracking with a Ctrl+C performance report (RPS, P50, P95, P99, error rate).

### Locust — 500 Concurrent Users

| Metric | Value |
|---|---|
| Peak RPS | 868 |
| Median Response (P50) | 12ms |
| P95 Response | 52ms |
| P99 Response | 120ms |
| Error Rate | 0% |
| Total Requests | 738,000+ |

---

## 🏛️ Key Engineering Decisions

### Why Online Learning (River) Instead of Batch ML?

Traditional batch ML requires collecting data → retraining → deploying. In a real-time pricing system, this introduces unacceptable lag. River's `ARFRegressor` trains incrementally with `learn_one()` on every single event, meaning the model improves continuously with zero downtime.

### Why Optimistic Locking Instead of Distributed Locks?

Redis `WATCH/MULTI/EXEC` provides optimistic concurrency control without blocking. Under 868 RPS with 500 concurrent users, pessimistic locks (e.g., Redlock) would create severe contention. Our approach retries with exponential backoff + jitter, achieving **0% error rate** under load.

### Why EMA Smoothing?

Raw ML predictions can oscillate wildly between events. The EMA (α=0.3) acts as a low-pass filter, blending the new prediction with the current price. This produces the smooth, continuous curves visible on the admin dashboard while still being responsive to sustained market shifts.

### Why a LangChain Auditor?

Automated pricing is powerful but risky. The RevOps Auditor acts as an autonomous safety net — it only activates on extreme price swings (>5%), queries corporate pricing playbooks via RAG, and can override the ML system. This mirrors how enterprise organizations layer human governance over automated systems.

---

## 📁 Project Structure

```
meridian/
├── backend/                    # NestJS API Gateway
│   └── src/
│       ├── telemetry/          # POST /telemetry ingestion
│       ├── checkout/           # Dynamic pricing interceptor
│       ├── admin/              # POST /admin/override (price lock)
│       ├── events/             # WebSocket gateway (Socket.IO)
│       └── redis/              # Redis module + service
│
├── ml-engine/                  # FastAPI ML Engine
│   ├── main.py                 # App + Redis + Pub/Sub subscriber
│   ├── ingest.py               # POST /ingest + background ML task
│   ├── features.py             # Feature engineering + target computation
│   ├── ml_pipeline.py          # River ARF + EMA + audit integration
│   ├── redis_lock.py           # Optimistic locking (WATCH/MULTI/EXEC)
│   ├── chaos_engine.py         # Load generator (steady traffic)
│   ├── chaos_engine_2.py       # Boom & Bust simulator + benchmarks
│   └── locustfile.py           # Enterprise Locust load tester
│
├── storefront/                 # Next.js 15 Frontend
│   └── src/app/
│       ├── page.tsx            # B2B Storefront
│       └── admin/
│           ├── page.tsx        # Admin Command Center
│           ├── DynamicPriceChart.tsx
│           ├── TrafficVolumeChart.tsx
│           ├── HumanOverridePanel.tsx
│           └── useAdminSocket.ts
│
└── docs/                       # Architecture documentation
```

---

## 📄 License

MIT

---

<p align="center">
  Built with ☕ and Claude by <strong>Pradeep Tiwari</strong>
</p>
