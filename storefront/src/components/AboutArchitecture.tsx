"use client";

import Link from "next/link";

// =============================================================================
// Meridian Storefront — About Architecture Section
// =============================================================================
// Two-part section:
//   1. Admin Dashboard CTA — hook recruiters into the live demo
//   2. Architecture Grid — 4-step pipeline explainer
// =============================================================================

const STEPS = [
  {
    number: "01",
    title: "The Request",
    subtitle: "Next.js on Vercel",
    description:
      "The storefront captures every user interaction — page views, cart additions, dwell time, competitor checks — and fires telemetry events across the wire in real-time.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    ),
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    number: "02",
    title: "The Gateway",
    subtitle: "NestJS on AWS EC2",
    description:
      "Traffic hits an AWS EC2 instance running a NestJS API Gateway that manages ingestion, load distribution, and persistent WebSocket connections to the admin dashboard.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 0 1-3-3m3 3a3 3 0 1 0 0 6h13.5a3 3 0 1 0 0-6m-16.5-3a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3m-19.5 0a4.5 4.5 0 0 1 .9-2.7L5.737 5.1a3.375 3.375 0 0 1 2.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 0 1 .9 2.7m0 0a3 3 0 0 1-3 3m0 3h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Zm-3 6h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Z" />
      </svg>
    ),
    color: "text-teal-600",
    bg: "bg-teal-500/10",
    border: "border-teal-500/20",
    gradient: "from-teal-500 to-emerald-500",
  },
  {
    number: "03",
    title: "The Brain",
    subtitle: "Redis In-Memory State",
    description:
      "The gateway checks Redis for live traffic spikes, product demand signals, and lock states — then passes the enriched context to the ML inference layer.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
      </svg>
    ),
    color: "text-purple-600",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    gradient: "from-purple-500 to-violet-500",
  },
  {
    number: "04",
    title: "The ML Engine",
    subtitle: "FastAPI + River ML",
    description:
      "A Python FastAPI service runs an Adaptive Random Forest model with EMA smoothing, calculates an optimized dynamic price, and returns it in under 50ms.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
      </svg>
    ),
    color: "text-amber-600",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    gradient: "from-amber-500 to-orange-500",
  },
];

export function AboutArchitecture() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white to-slate-50/80 border-t border-slate-200/60">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-28">

        {/* ═══════════════════════════════════════════════════════
            PART 1: Admin Dashboard CTA
            ═══════════════════════════════════════════════════════ */}
        <div className="relative rounded-2xl border border-teal-500/20 bg-gradient-to-br from-slate-900 to-slate-800 p-8 lg:p-12 mb-20 overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />

          <div className="relative flex flex-col lg:flex-row items-start lg:items-center gap-8">
            {/* Left: Text content */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                <span className="text-xs font-semibold text-emerald-400 tracking-wider uppercase">
                  Live Dashboard Available
                </span>
              </div>

              <h3 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-tight mb-3">
                Watch the ML Engine{" "}
                <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                  Think in Real-Time
                </span>
              </h3>

              <p className="text-slate-400 text-sm lg:text-base leading-relaxed max-w-xl">
                The Admin Command Center streams live WebSocket data from the pricing engine.
                Watch Recharts visualize price multiplier fluctuations, traffic volume heatmaps,
                and the RevOps AI agent auditing decisions — all updating in real-time.
              </p>
            </div>

            {/* Right: CTA Button */}
            <div className="shrink-0">
              <Link
                href="/admin"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl
                           bg-gradient-to-r from-teal-500 to-emerald-600
                           hover:from-teal-400 hover:to-emerald-500
                           text-white text-sm font-semibold
                           shadow-lg shadow-teal-500/25
                           hover:shadow-xl hover:shadow-teal-500/30
                           active:scale-[0.97] transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
                </svg>
                View Live Admin Dashboard
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            PART 2: Architecture Steps
            ═══════════════════════════════════════════════════════ */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-600 text-xs font-semibold mb-4">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
            </svg>
            How It Works
          </span>
          <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            From Click to{" "}
            <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              Dynamic Price
            </span>
          </h2>
          <p className="mt-4 text-base text-slate-500 leading-relaxed">
            Four microservices working in concert — every user event is processed
            end-to-end in under 50 milliseconds.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map((step, idx) => (
            <div key={step.number} className="relative group">
              {/* Connector line (desktop) */}
              {idx < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-10 -right-2.5 w-5 z-10">
                  <div className="h-px bg-slate-300" />
                  <svg className="absolute -right-1 -top-1 w-2 h-2 text-slate-300" fill="currentColor" viewBox="0 0 8 8">
                    <path d="M0 0l4 4-4 4z" />
                  </svg>
                </div>
              )}

              <div
                className={`relative h-full rounded-2xl border ${step.border} bg-white
                            p-6 transition-all duration-300
                            hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-1`}
              >
                {/* Step header */}
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-xl ${step.bg}
                                ${step.color} transition-transform group-hover:scale-110`}
                  >
                    {step.icon}
                  </div>
                  <span className="text-[36px] font-black text-slate-100 leading-none select-none">
                    {step.number}
                  </span>
                </div>

                {/* Content */}
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  {step.title}
                </h3>
                <p className={`text-[11px] font-semibold ${step.color} tracking-wide uppercase mb-2.5`}>
                  {step.subtitle}
                </p>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {step.description}
                </p>

                {/* Bottom accent */}
                <div
                  className={`absolute bottom-0 left-6 right-6 h-0.5 rounded-full bg-gradient-to-r ${step.gradient}
                              opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom stats */}
        <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-14">
          {[
            { value: "879", label: "Peak RPS" },
            { value: "<50ms", label: "P50 Latency" },
            { value: "0%", label: "Error Rate" },
            { value: "5", label: "Microservices" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {stat.value}
              </p>
              <p className="text-[11px] text-slate-400 font-medium tracking-wider uppercase mt-0.5">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-teal-500/[0.03] blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3 w-80 h-80 rounded-full bg-purple-500/[0.03] blur-3xl pointer-events-none" />
    </section>
  );
}
