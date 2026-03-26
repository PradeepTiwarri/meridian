"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useAdminSocket, TelemetryEvent, AgentThought } from "./useAdminSocket";
import HumanOverridePanel from "./HumanOverridePanel";

// Dynamic imports with SSR disabled — prevents Recharts ResponsiveContainer hydration mismatch
const DynamicPriceChart = dynamic(() => import("./DynamicPriceChart"), {
  ssr: false,
  loading: () => (
    <div className="h-[240px] w-full animate-pulse bg-slate-800/5 rounded-xl flex items-center justify-center text-xs text-slate-400">
      Loading live telemetry...
    </div>
  ),
});
const TrafficVolumeChart = dynamic(() => import("./TrafficVolumeChart"), {
  ssr: false,
  loading: () => (
    <div className="h-[240px] w-full animate-pulse bg-slate-800/5 rounded-xl flex items-center justify-center text-xs text-slate-400">
      Loading live telemetry...
    </div>
  ),
});

// =============================================================================
// Meridian Admin — Command Center (Enterprise Dense Layout)
// =============================================================================
// Row 1: Telemetry (left) + Agent Terminal (right) — h-[400px]
// Row 2: Price Chart (2/3) + Traffic Volume (1/3)
// Row 3: Override Controls (5-col horizontal grid)
// =============================================================================

const EVENT_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  cart_addition:        { label: "CART_ADD",        color: "#3b82f6", icon: "🛒" },
  page_view:            { label: "PAGE_VIEW",      color: "#8b5cf6", icon: "👁" },
  competitor_price_sim: { label: "COMP_DROP",      color: "#f59e0b", icon: "📉" },
  inventory_drop_sim:   { label: "INV_DROP",       color: "#ef4444", icon: "📦" },
  dwell_time_seconds:   { label: "DWELL",          color: "#06b6d4", icon: "⏱" },
};

const STEP_COLORS: Record<string, string> = {
  TRIGGER:   "text-yellow-400",
  RETRIEVAL: "text-blue-400",
  REASONING: "text-purple-400",
  DECISION:  "text-emerald-400",
};

// Product filter constants (shared with charts)
const ALL_PRODUCTS = ["prod_001", "prod_002", "prod_003", "prod_004", "prod_005"];

const PRODUCT_COLORS: Record<string, string> = {
  prod_001: "#3b82f6",
  prod_002: "#8b5cf6",
  prod_003: "#06b6d4",
  prod_004: "#f59e0b",
  prod_005: "#ef4444",
};

const PRODUCT_LABELS: Record<string, string> = {
  prod_001: "API Gateway",
  prod_002: "Cloud Storage",
  prod_003: "GPU Cluster",
  prod_004: "Data Pipeline",
  prod_005: "ML Platform",
};

/* ── TelemetryRow ─────────────────────────────────────────────────── */

function TelemetryRow({ event }: { event: TelemetryEvent }) {
  const cfg = EVENT_CONFIG[event.event_type] || { label: event.event_type, color: "#64748b", icon: "·" };
  const ts = event.timestamp
    ? new Date(typeof event.timestamp === "string" ? event.timestamp : event.timestamp * 1000)
        .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "";

  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-slate-100/80 transition-colors text-xs group">
      <span className="text-[10px] text-slate-400 tabular-nums w-[58px] shrink-0">{ts}</span>
      <span
        className="font-mono font-semibold tracking-tight px-1.5 py-0.5 rounded text-[10px]"
        style={{ backgroundColor: `${cfg.color}15`, color: cfg.color }}
      >
        {cfg.label}
      </span>
      {event.product_id && (
        <span className="font-mono text-slate-600 text-[11px]">{event.product_id}</span>
      )}
      {event.session_id && (
        <span className="text-slate-400 text-[10px] ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
          {event.session_id.slice(0, 8)}
        </span>
      )}
    </div>
  );
}

/* ── Terminal Line ────────────────────────────────────────────────── */

function TerminalLine({ thought }: { thought: AgentThought }) {
  const color = thought.step === "DECISION" && thought.message.includes("ERROR")
    ? "text-rose-400"
    : STEP_COLORS[thought.step] || "text-slate-400";
  const ts = thought.timestamp
    ? new Date(thought.timestamp * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "";

  return (
    <div className="flex gap-1.5 py-0.5 text-[12px] leading-5">
      <span className="text-slate-600 tabular-nums shrink-0 w-[52px]">{ts}</span>
      <span className={`font-semibold shrink-0 w-[80px] ${color}`}>[{thought.step}]</span>
      <span className="text-slate-300 break-words">
        {thought.product_id && <span className="text-cyan-400">{thought.product_id} </span>}
        {thought.message}
      </span>
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────────────── */

export default function AdminDashboard() {
  const { telemetry, thoughts, priceHistory, trafficBuckets, connected } = useAdminSocket();
  const terminalRef = useRef<HTMLDivElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  // ─── Global product filter ──────────────────────────────
  const [activeProducts, setActiveProducts] = useState<string[]>([...ALL_PRODUCTS]);

  const toggleProduct = useCallback((pid: string) => {
    setActiveProducts((prev) =>
      prev.includes(pid) ? prev.filter((p) => p !== pid) : [...prev, pid]
    );
  }, []);

  const toggleAll = useCallback(() => {
    setActiveProducts((prev) =>
      prev.length === ALL_PRODUCTS.length ? [] : [...ALL_PRODUCTS]
    );
  }, []);

  useEffect(() => {
    if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
  }, [thoughts]);

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [telemetry]);

  return (
    <div className="min-h-screen bg-slate-100">
      {/* ─── Header ─────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 px-3 sm:px-4 py-2.5 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">M</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-800 leading-tight">
              Meridian Command Center
            </h1>
            <p className="text-[10px] text-slate-400 -mt-0.5">
              RevOps Intelligence · Real-time ML Pricing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status */}
          <span className="flex items-center gap-1.5 text-[11px] font-medium">
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
            <span className={connected ? "text-emerald-600" : "text-red-500"}>
              {connected ? "LIVE" : "OFFLINE"}
            </span>
          </span>
          {/* Counters */}
          <div className="hidden sm:block text-[10px] text-slate-400 border-l border-slate-200 pl-3 font-mono tabular-nums">
            {telemetry.length} evt · {thoughts.length} ai · {priceHistory.length} px
          </div>
        </div>
      </header>

      {/* ─── Content ────────────────────────────────────────── */}
      <div className="px-3 sm:px-4 py-4 max-w-[1600px] mx-auto space-y-4">

        {/* ═══ ROW 1: Telemetry + Terminal ════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Telemetry Feed */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
              <h2 className="text-xs font-semibold tracking-wider text-slate-500 uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                Market Telemetry
              </h2>
              <span className="text-[10px] text-slate-400">{telemetry.length} events</span>
            </div>
            <div ref={feedRef} className="h-[300px] sm:h-[380px] overflow-y-auto overflow-x-auto px-1 py-1">
              {telemetry.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-1">
                  <span className="text-2xl">📡</span>
                  <p className="text-xs">Waiting for events…</p>
                </div>
              ) : (
                telemetry.map((event, i) => <TelemetryRow key={i} event={event} />)
              )}
            </div>
          </div>

          {/* Agent Terminal */}
          <div className="bg-slate-900 rounded-lg border border-slate-700 shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/80 border-b border-slate-700/50 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
              <span className="text-[10px] text-slate-500 ml-1.5 font-mono">
                revops-agent@meridian ~/audit
              </span>
              <span className="ml-auto text-[10px] text-slate-600 font-mono">{thoughts.length} lines</span>
            </div>
            <div ref={terminalRef} className="h-[280px] sm:h-[350px] overflow-y-auto overflow-x-auto p-3 font-mono text-[12px] leading-5">
              {thoughts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-1">
                  <span className="text-2xl">🤖</span>
                  <p className="text-xs">Agent idle</p>
                  <p className="text-[10px] text-slate-700 font-mono mt-1">$ watch --multiplier &gt; [0.90, 1.10]</p>
                  <span className="inline-block w-1.5 h-3 bg-emerald-400 mt-1 animate-pulse" />
                </div>
              ) : (
                thoughts.map((thought, i) => <TerminalLine key={i} thought={thought} />)
              )}
              {thoughts.length > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-emerald-400 text-[10px]">$</span>
                  <span className="inline-block w-1.5 h-3 bg-emerald-400 animate-pulse" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══ FILTER BAR ═════════════════════════════════ */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm px-4 py-2.5 flex items-center gap-3 flex-wrap">
          <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase shrink-0">
            Filter
          </span>
          <div className="h-4 w-px bg-slate-200" />
          {ALL_PRODUCTS.map((pid) => {
            const isActive = activeProducts.includes(pid);
            const color = PRODUCT_COLORS[pid];
            return (
              <button
                key={pid}
                onClick={() => toggleProduct(pid)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer border ${
                  isActive
                    ? "text-white shadow-sm"
                    : "text-slate-400 bg-white border-slate-200 hover:border-slate-300"
                }`}
                style={
                  isActive
                    ? { backgroundColor: color, borderColor: color }
                    : undefined
                }
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-white/70" : "bg-slate-300"}`}
                />
                {PRODUCT_LABELS[pid]}
              </button>
            );
          })}
          <div className="h-4 w-px bg-slate-200" />
          <button
            onClick={toggleAll}
            className="text-[10px] font-semibold text-slate-500 hover:text-slate-700 px-2 py-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {activeProducts.length === ALL_PRODUCTS.length ? "Hide All" : "Show All"}
          </button>
        </div>

        {/* ═══ ROW 2: Price Chart (2/3) + Traffic (1/3) ══════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 min-w-0 overflow-x-auto">
            <DynamicPriceChart priceHistory={priceHistory} activeProducts={activeProducts} />
          </div>
          <div className="lg:col-span-1 min-w-0 overflow-x-auto">
            <TrafficVolumeChart trafficBuckets={trafficBuckets} activeProducts={activeProducts} />
          </div>
        </div>

        {/* ═══ ROW 3: Override Controls ══════════════════════ */}
        <div className="pb-4">
          <HumanOverridePanel priceHistory={priceHistory} />
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
