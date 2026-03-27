import Link from "next/link";
import type { Metadata } from "next";

// =============================================================================
// Meridian — Architecture Case Study Page
// =============================================================================
// A recruiter-facing deep dive into the microservices architecture.
// =============================================================================

export const metadata: Metadata = {
  title: "System Architecture — Meridian",
  description:
    "Technical deep dive into the Meridian real-time dynamic pricing engine — microservices, ML pipeline, and infrastructure.",
};

// ─── Data Flow Steps ─────────────────────────────────────

const DATA_FLOW = [
  {
    step: 1,
    title: "Client Interaction",
    tech: "Next.js · Vercel",
    description:
      "The user browses the storefront. Client-side React components capture every interaction — page views, product dwell time, cart additions, competitor price simulations — and immediately dispatch telemetry via HTTP fetch with keepalive. The admin dashboard opens a persistent WebSocket connection to receive live updates.",
    color: "bg-blue-500",
    accent: "text-blue-600",
    accentBg: "bg-blue-500/10",
  },
  {
    step: 2,
    title: "The API Gateway",
    tech: "NestJS · AWS EC2",
    description:
      "Hosted on an AWS EC2 instance, the NestJS gateway intercepts all inbound traffic. It validates CORS headers, parses the telemetry payload, and manages live Socket.IO rooms for the Admin Command Center. Each telemetry event is published to Redis Pub/Sub channels for downstream consumption.",
    color: "bg-teal-500",
    accent: "text-teal-600",
    accentBg: "bg-teal-500/10",
  },
  {
    step: 3,
    title: "High-Speed State",
    tech: "Redis · Pub/Sub",
    description:
      "NestJS pushes incoming traffic metrics into Redis. A Python subscriber listens to the telemetry stream, computes rolling demand features (page views, cart conversions, dwell averages), and maintains per-product state using optimistic locking with WATCH/MULTI/EXEC to handle concurrent writes under load.",
    color: "bg-purple-500",
    accent: "text-purple-600",
    accentBg: "bg-purple-500/10",
  },
  {
    step: 4,
    title: "The ML Engine",
    tech: "FastAPI · River ML",
    description:
      "A dedicated Python microservice runs an Adaptive Random Forest regressor (online learning — no batch retraining required). It processes the current demand features, applies EMA smoothing to prevent price oscillation, and calculates an optimized multiplier. A LangChain + Llama 3 RevOps agent audits every price change autonomously.",
    color: "bg-amber-500",
    accent: "text-amber-600",
    accentBg: "bg-amber-500/10",
  },
  {
    step: 5,
    title: "Real-Time Broadcast",
    tech: "WebSocket · Recharts",
    description:
      "The gateway receives the new price multiplier, updates Redis state, and instantly emits the data via WebSocket to all connected clients. The storefront updates the product card price, the admin dashboard redraws Recharts visualizations, and the RevOps terminal logs the AI agent's reasoning — all in under 50ms.",
    color: "bg-emerald-500",
    accent: "text-emerald-600",
    accentBg: "bg-emerald-500/10",
  },
];

// =============================================================================
// Page Component
// =============================================================================

export default function ArchitecturePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ─── Navigation ───────────────────────────────────── */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-teal-600 text-white font-black text-[10px]">
              M
            </div>
            <span className="text-sm font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
              Meridian
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
              Storefront
            </Link>
            <Link
              href="/admin"
              className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
              Admin
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6">
        {/* ═══════════════════════════════════════════════════
            HERO
            ═══════════════════════════════════════════════════ */}
        <header className="pt-16 pb-14 lg:pt-24 lg:pb-20 border-b border-slate-200/60">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-5">
              <span className="h-px w-8 bg-teal-500" />
              <span className="text-xs font-semibold text-teal-600 tracking-wider uppercase">
                Technical Case Study
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
              System Architecture{" "}
              <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                & Data Flow
              </span>
            </h1>
            <p className="mt-5 text-base lg:text-lg text-slate-500 leading-relaxed max-w-2xl">
              Meridian is a real-time, event-driven microservices architecture
              deployed on AWS. It processes storefront telemetry and calculates
              ML-driven dynamic pricing in under 50 milliseconds —
              end-to-end.
            </p>

            {/* Quick stats */}
            <div className="mt-8 flex flex-wrap items-center gap-6">
              {[
                { v: "879 RPS", l: "Peak throughput" },
                { v: "<50ms", l: "P50 latency" },
                { v: "0%", l: "Error rate" },
                { v: "5", l: "Microservices" },
              ].map((s) => (
                <div key={s.l} className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">{s.v}</span>
                  <span className="text-xs text-slate-400">{s.l}</span>
                </div>
              ))}
            </div>
          </div>
        </header>

        {/* ═══════════════════════════════════════════════════
            TECH STACK
            ═══════════════════════════════════════════════════ */}
        <section className="py-14 lg:py-20 border-b border-slate-200/60">
          <div className="flex items-center gap-2 mb-2">
            <span className="h-px w-6 bg-slate-300" />
            <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
              Tech Stack
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            What&apos;s under the hood
          </h2>
          <p className="text-sm text-slate-500 mb-8 max-w-xl">
            I picked each tool to solve a specific problem, not to pad a resume. Here&apos;s why.
          </p>

          <div className="divide-y divide-slate-200">
            <div className="py-5 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-6">
              <span className="text-sm font-bold text-slate-900 sm:w-40 shrink-0">Next.js 15</span>
              <p className="text-sm text-slate-500 leading-relaxed">
                App Router with React Server Components for the parts that don&apos;t need interactivity, and <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">dynamic()</code> imports with <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">ssr: false</code> for Recharts — because ResponsiveContainer throws hydration errors otherwise. Deployed on Vercel.
              </p>
            </div>
            <div className="py-5 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-6">
              <span className="text-sm font-bold text-slate-900 sm:w-40 shrink-0">NestJS</span>
              <p className="text-sm text-slate-500 leading-relaxed">
                The API gateway. Handles REST endpoints, proxies telemetry to Redis Pub/Sub, and runs a Socket.IO server for the admin dashboard. I needed something opinionated enough to not waste time on project structure but flexible enough for WebSockets — NestJS does both.
              </p>
            </div>
            <div className="py-5 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-6">
              <span className="text-sm font-bold text-slate-900 sm:w-40 shrink-0">Redis</span>
              <p className="text-sm text-slate-500 leading-relaxed">
                Three jobs: Pub/Sub message bus between NestJS and Python, an in-memory store for per-product demand state (page views, cart counts, dwell averages), and optimistic locking via <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">WATCH/MULTI/EXEC</code> so concurrent workers don&apos;t clobber each other&apos;s price updates.
              </p>
            </div>
            <div className="py-5 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-6">
              <span className="text-sm font-bold text-slate-900 sm:w-40 shrink-0">FastAPI + River</span>
              <p className="text-sm text-slate-500 leading-relaxed">
                The ML layer. FastAPI for the async HTTP server, River&apos;s <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">ARFRegressor</code> for online learning (trains on every event — no batch jobs, no redeployment). An EMA filter smooths the output so prices don&apos;t bounce around on every request. A LangChain + Llama 3 agent audits outlier decisions.
              </p>
            </div>
            <div className="py-5 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-6">
              <span className="text-sm font-bold text-slate-900 sm:w-40 shrink-0">AWS + Docker</span>
              <p className="text-sm text-slate-500 leading-relaxed">
                Docker Compose with hard memory caps — 100MB Redis, 400MB ML engine, 300MB gateway — tuned to run on a single free-tier EC2 <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">t3.micro</code> (1GB RAM). Ngrok handles TLS so Vercel&apos;s HTTPS frontend can talk to the EC2 backend without mixed-content blocks.
              </p>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            DATA FLOW TIMELINE
            ═══════════════════════════════════════════════════ */}
        <section className="py-14 lg:py-20 border-b border-slate-200/60">
          <div className="flex items-center gap-2 mb-2">
            <span className="h-px w-6 bg-slate-300" />
            <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
              Data Flow
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            Request Lifecycle
          </h2>
          <p className="text-sm text-slate-500 mb-10 max-w-xl">
            Every user interaction follows this path through the system —
            from browser click to optimized price.
          </p>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[15px] top-0 bottom-0 w-px bg-slate-200 hidden sm:block" />

            <div className="space-y-8">
              {DATA_FLOW.map((item) => (
                <div key={item.step} className="relative flex gap-5 sm:gap-6">
                  {/* Dot */}
                  <div className="relative shrink-0 hidden sm:flex flex-col items-center">
                    <div className={`w-[31px] h-[31px] rounded-full ${item.color} flex items-center justify-center z-10`}>
                      <span className="text-white text-xs font-bold">{item.step}</span>
                    </div>
                  </div>

                  {/* Mobile step number */}
                  <div className={`sm:hidden shrink-0 w-8 h-8 rounded-full ${item.color} flex items-center justify-center`}>
                    <span className="text-white text-xs font-bold">{item.step}</span>
                  </div>

                  {/* Content card */}
                  <div className="flex-1 pb-2">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h3 className="text-base font-bold text-slate-900">
                        {item.title}
                      </h3>
                      <span className={`text-[10px] font-semibold ${item.accent} ${item.accentBg} px-2 py-0.5 rounded-full`}>
                        {item.tech}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            INFRASTRUCTURE NOTES
            ═══════════════════════════════════════════════════ */}
        <section className="py-14 lg:py-20 border-b border-slate-200/60">
          <div className="flex items-center gap-2 mb-2">
            <span className="h-px w-6 bg-slate-300" />
            <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
              Infrastructure
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            Deployment & DevOps
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                </svg>
                Docker Compose
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                The entire backend is containerized with Docker Compose. Memory limits
                are configured per service (Redis 100MB, ML Engine 400MB, Gateway 300MB)
                to fit on a <strong className="text-slate-700">1GB AWS t3.micro</strong> instance — total cost: $0/month on free tier.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
                Secure Tunneling
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                The Vercel frontend (HTTPS) connects to the EC2 backend via
                <strong className="text-slate-700"> Ngrok</strong> secure tunnels, eliminating mixed-content
                browser blocks and providing TLS termination without managing certificates.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5" />
                </svg>
                Online ML
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                The pricing model uses <strong className="text-slate-700">River&apos;s ARFRegressor</strong> for online
                learning — it trains on every incoming event without batch jobs or model
                redeployment. Zero downtime model updates.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                Concurrency
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Redis <strong className="text-slate-700">WATCH/MULTI/EXEC</strong> optimistic locking with exponential
                backoff handles concurrent price updates from multiple workers without
                contention — stress-tested to 879 RPS at 0% error rate.
              </p>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            CTA FOOTER
            ═══════════════════════════════════════════════════ */}
        <section className="py-16 lg:py-20">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              See it in action
            </h2>
            <p className="text-sm text-slate-500 mb-8 max-w-md mx-auto">
              Browse the live storefront to trigger telemetry, or watch the admin
              dashboard visualize the ML engine reasoning in real-time.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                           bg-slate-900 hover:bg-slate-800
                           text-white text-sm font-semibold
                           shadow-lg shadow-slate-900/10
                           active:scale-[0.97] transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
                </svg>
                View Live Storefront
              </Link>
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                           bg-gradient-to-r from-teal-500 to-emerald-600
                           hover:from-teal-400 hover:to-emerald-500
                           text-white text-sm font-semibold
                           shadow-lg shadow-teal-500/20
                           active:scale-[0.97] transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
                </svg>
                View Live Admin Dashboard
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50/50">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-6 w-6 rounded-lg bg-teal-600 text-white font-black text-[10px]">
              M
            </div>
            <span className="text-sm font-semibold text-slate-900">Meridian</span>
          </div>
          <p className="text-xs text-slate-400">
            © 2026 Meridian Ecosystem · Dynamic Pricing Platform
          </p>
        </div>
      </footer>
    </div>
  );
}
