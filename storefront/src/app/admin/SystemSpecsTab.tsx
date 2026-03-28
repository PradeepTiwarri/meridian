"use client";

import { motion } from "framer-motion";
import {
  Monitor,
  Server,
  Database,
  Brain,
  Bot,
  Radio,
  Clock,
  ShoppingCart,
  TrendingDown,
  PackageMinus,
} from "lucide-react";

// =============================================================================
// SystemSpecsTab — Animated Architecture Timeline + ML Pricing Manual
// =============================================================================
// Uses framer-motion stagger entrances, lucide-react icons, pulsing dots,
// and a gradient vertical timeline.
// =============================================================================

const ARCH_STEPS = [
  {
    num: 1,
    label: "The Frontend",
    tech: "Next.js · Vercel",
    Icon: Monitor,
    techColor: "text-blue-500",
    dotGlow: "shadow-blue-400/50",
    desc: `React components capture dwell time, cart additions, and simulated
           market events. Each interaction gets a session ID and fires via
           fetch() with keepalive. The admin dashboard holds a persistent
           Socket.IO connection for live updates.`,
  },
  {
    num: 2,
    label: "The API Gateway",
    tech: "NestJS · AWS EC2",
    Icon: Server,
    techColor: "text-teal-500",
    dotGlow: "shadow-teal-400/50",
    desc: `Validates incoming telemetry, publishes it to meridian_telemetry_stream,
           and manages Socket.IO rooms. Also subscribes to meridian_price_updates
           and meridian_agent_thoughts to forward live data to the frontend.`,
  },
  {
    num: 3,
    label: "The Message Broker",
    tech: "Redis · Pub/Sub + State",
    Icon: Database,
    techColor: "text-purple-500",
    dotGlow: "shadow-purple-400/50",
    desc: `Three jobs: Pub/Sub bus for inter-service messaging, hash maps for
           per-product demand state, and WATCH/MULTI/EXEC optimistic locking so
           concurrent workers can't overwrite each other. Memory budget: 100MB.`,
  },
  {
    num: 4,
    label: "The ML Engine",
    tech: "FastAPI · River ARF",
    Icon: Brain,
    techColor: "text-amber-500",
    dotGlow: "shadow-amber-400/50",
    desc: `A Python subscriber consumes the telemetry stream and feeds demand
           features into River's Adaptive Random Forest — online learning, no
           batch jobs. The raw prediction gets EMA-smoothed to prevent jitter,
           then published as a multiplier.`,
  },
  {
    num: 5,
    label: "The RevOps Agent",
    tech: "LangChain · Llama 3 70B",
    Icon: Bot,
    techColor: "text-rose-500",
    dotGlow: "shadow-rose-400/50",
    desc: `When the multiplier crosses [0.90, 1.10], a LangChain agent wakes up.
           It pulls context from Redis, retrieves pricing playbooks from Supabase
           pgvector, and reasons about whether the extreme price is justified.
           Every step streams live to the Command Center terminal.`,
  },
  {
    num: 6,
    label: "The Broadcast",
    tech: "WebSocket · Recharts",
    Icon: Radio,
    techColor: "text-emerald-500",
    dotGlow: "shadow-emerald-400/50",
    desc: `The final multiplier hits NestJS via Redis, which emits it over
           WebSocket to every connected client. Product card prices flash,
           Recharts charts extend, and agent reasoning logs appear — all
           under 50ms.`,
  },
];

const ML_TRIGGERS = [
  {
    num: "01",
    label: "Dwell Time",
    tag: "Buyer intent",
    Icon: Clock,
    numColor: "text-cyan-200",
    tagColor: "text-cyan-600",
    hoverColor: "group-hover:text-cyan-700",
    hoverBg: "hover:bg-cyan-50/40",
    desc: `When someone lingers on a product card, the frontend reports the
           duration. Prolonged engagement signals high buyer intent. If demand
           is low, the model applies a discount to close. If demand is high, it
           reads the dwell as willingness to pay — and holds or raises the price.`,
  },
  {
    num: "02",
    label: "Add to Cart",
    tag: "Demand spike",
    Icon: ShoppingCart,
    numColor: "text-blue-200",
    tagColor: "text-blue-600",
    hoverColor: "group-hover:text-blue-700",
    hoverBg: "hover:bg-blue-50/40",
    desc: `Every cart_addition increments a per-product demand counter in Redis.
           When the rolling window sees a spike well above baseline, the
           Adaptive Random Forest pushes the multiplier upward — classic surge
           pricing. Primary driver of price increases during load tests.`,
  },
  {
    num: "03",
    label: "Competitor Price Drop",
    tag: "Market pressure",
    Icon: TrendingDown,
    numColor: "text-amber-200",
    tagColor: "text-amber-600",
    hoverColor: "group-hover:text-amber-700",
    hoverBg: "hover:bg-amber-50/40",
    desc: `A competitor_price_sim event tells the ML engine that a competitor
           undercut us. The model responds by automatically matching or
           undercutting the competitor — pulling the multiplier below 1.0 to
           defend market share.`,
  },
  {
    num: "04",
    label: "Inventory Drop",
    tag: "Scarcity",
    Icon: PackageMinus,
    numColor: "text-red-200",
    tagColor: "text-red-600",
    hoverColor: "group-hover:text-red-700",
    hoverBg: "hover:bg-red-50/40",
    desc: `When stock depletes rapidly via inventory_drop_sim, the engine treats
           it as a scarcity signal. The multiplier surges aggressively to maximize
           margins on remaining units. This is the trigger most likely to wake
           the RevOps agent.`,
  },
];

// Animation variants
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] as const } },
};

export default function SystemSpecsTab() {
  return (
    <div className="max-w-3xl mx-auto py-6">
      {/* ──── Part 1: Architecture ──────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-4"
      >
        <span className="text-[10px] font-bold text-teal-600 tracking-[0.2em] uppercase">
          Architecture
        </span>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
          Request lifecycle
        </h2>
        <p className="text-sm text-slate-400 mt-2 max-w-lg">
          Every user interaction follows this path — from browser event
          to optimized price on the storefront. Round-trip: &lt;50ms.
        </p>
      </motion.div>

      {/* Timeline with gradient border */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative ml-4 pl-8 space-y-0"
      >
        {/* Gradient vertical line */}
        <div
          className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full"
          style={{
            background: "linear-gradient(to bottom, #14b8a6, #8b5cf6, #3b82f6)",
          }}
        />

        {ARCH_STEPS.map((step, i) => (
          <motion.div key={step.num} variants={fadeUp}>
            <div className="relative py-6 group hover:bg-teal-50/50 -ml-8 pl-8 -mr-4 pr-4 rounded-r-lg transition-colors">
              {/* Pulsing dot */}
              <div
                className={`absolute -left-[11px] top-6 w-[22px] h-[22px] rounded-full bg-white border-2 border-teal-500 flex items-center justify-center z-10
                  shadow-[0_0_8px] ${step.dotGlow}
                  group-hover:shadow-[0_0_14px] group-hover:scale-110 transition-all`}
              >
                <span className="text-[9px] font-black text-teal-600">{step.num}</span>
                {/* Ping ring */}
                <span className="absolute inset-0 rounded-full border-2 border-teal-400 animate-ping opacity-20" />
              </div>

              {/* Tech badge with icon */}
              <div className={`flex items-center gap-1.5 ${step.techColor}`}>
                <step.Icon className="w-3.5 h-3.5" strokeWidth={2} />
                <span className="text-[10px] font-semibold tracking-wider uppercase">
                  {step.tech}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 mt-0.5 group-hover:text-teal-700 transition-colors">
                {step.label}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed mt-2">
                {step.desc}
              </p>
            </div>
            {i < ARCH_STEPS.length - 1 && (
              <div className="border-t border-slate-100 ml-0" />
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* ──── Part 2: ML Pricing Manual ──────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.6 }}
        className="mt-14 mb-6"
      >
        <span className="text-[10px] font-bold text-teal-600 tracking-[0.2em] uppercase">
          ML Pricing Manual
        </span>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
          How signals move the multiplier
        </h2>
        <p className="text-sm text-slate-400 mt-2 max-w-lg">
          Four event types feed the model. Each has a different
          effect on the pricing output.
        </p>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-0"
      >
        {ML_TRIGGERS.map((t, i) => (
          <motion.div key={t.num} variants={fadeUp}>
            <div
              className={`relative py-7 border-t border-slate-200 group -mx-4 px-4 transition-colors ${t.hoverBg} ${
                i === ML_TRIGGERS.length - 1 ? "border-b" : ""
              }`}
            >
              <div className="flex items-start gap-5">
                <div className="flex flex-col items-center shrink-0 w-10 pt-0.5">
                  <span className={`text-3xl font-black leading-none select-none tabular-nums ${t.numColor}`}>
                    {t.num}
                  </span>
                  <t.Icon className={`w-4 h-4 mt-2 ${t.tagColor} opacity-50`} strokeWidth={1.5} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`text-base font-bold text-slate-900 transition-colors ${t.hoverColor}`}>
                      {t.label}
                    </h3>
                    <span className={`text-[9px] font-bold tracking-widest uppercase ${t.tagColor}`}>
                      {t.tag}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {t.desc}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Inline keyframes for the dot ping */}
      <style jsx>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
