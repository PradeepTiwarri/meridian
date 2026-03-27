"use client";

// =============================================================================
// Meridian Storefront — How It Works (Architecture Section)
// =============================================================================
// 4-step visual explainer of the backend pricing pipeline.
// =============================================================================

const STEPS = [
  {
    number: "01",
    title: "The Request",
    subtitle: "Next.js → Internet",
    description:
      "The Vercel-hosted storefront captures user telemetry — page views, cart additions, dwell time — and fires it across the wire in real-time.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    ),
    accent: "from-blue-500 to-cyan-500",
    accentBg: "bg-blue-500/10",
    accentText: "text-blue-500",
    accentBorder: "border-blue-500/20",
  },
  {
    number: "02",
    title: "The Gateway",
    subtitle: "NestJS on AWS EC2",
    description:
      "Traffic hits an AWS EC2 instance running a NestJS API Gateway, which manages ingestion, load balancing, and real-time WebSocket connections.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 0 1-3-3m3 3a3 3 0 1 0 0 6h13.5a3 3 0 1 0 0-6m-16.5-3a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3m-19.5 0a4.5 4.5 0 0 1 .9-2.7L5.737 5.1a3.375 3.375 0 0 1 2.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 0 1 .9 2.7m0 0a3 3 0 0 1-3 3m0 3h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Zm-3 6h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Z" />
      </svg>
    ),
    accent: "from-teal-500 to-emerald-500",
    accentBg: "bg-teal-500/10",
    accentText: "text-teal-600",
    accentBorder: "border-teal-500/20",
  },
  {
    number: "03",
    title: "The Brain",
    subtitle: "Redis + ML Pipeline",
    description:
      "NestJS checks Redis for live traffic spikes and product state, then passes the enriched data to a Python FastAPI Machine Learning Engine for inference.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    ),
    accent: "from-purple-500 to-violet-500",
    accentBg: "bg-purple-500/10",
    accentText: "text-purple-600",
    accentBorder: "border-purple-500/20",
  },
  {
    number: "04",
    title: "The Output",
    subtitle: "< 50ms Response",
    description:
      "The ML Engine runs an Adaptive Random Forest model with EMA smoothing, calculates an optimized dynamic price, and returns it to the storefront in under 50ms.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
      </svg>
    ),
    accent: "from-amber-500 to-orange-500",
    accentBg: "bg-amber-500/10",
    accentText: "text-amber-600",
    accentBorder: "border-amber-500/20",
  },
];

export function HowItWorks() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white to-slate-50 border-t border-slate-200/60">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-28">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-600 text-xs font-semibold mb-4">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
            </svg>
            Architecture
          </span>
          <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            How Dynamic Pricing{" "}
            <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              Actually Works
            </span>
          </h2>
          <p className="mt-4 text-base text-slate-500 leading-relaxed">
            From storefront click to optimized price — our full-stack ML pipeline
            processes every event in under 50 milliseconds.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
          {STEPS.map((step, idx) => (
            <div key={step.number} className="relative group">
              {/* Connector line (desktop only, not on last card) */}
              {idx < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-10 -right-2 w-4 h-px bg-slate-300 z-10" />
              )}

              <div
                className={`relative h-full rounded-2xl border ${step.accentBorder} bg-white
                            p-6 transition-all duration-300
                            hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-1`}
              >
                {/* Step number */}
                <div className="flex items-center justify-between mb-5">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-xl ${step.accentBg}
                                ${step.accentText} transition-transform group-hover:scale-110`}
                  >
                    {step.icon}
                  </div>
                  <span className="text-[40px] font-black text-slate-100 leading-none select-none">
                    {step.number}
                  </span>
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  {step.title}
                </h3>
                <p
                  className={`text-xs font-semibold ${step.accentText} tracking-wide uppercase mb-3`}
                >
                  {step.subtitle}
                </p>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {step.description}
                </p>

                {/* Bottom accent bar */}
                <div
                  className={`absolute bottom-0 left-6 right-6 h-0.5 rounded-full bg-gradient-to-r ${step.accent}
                              opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom stats */}
        <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12">
          {[
            { value: "879", label: "Peak RPS" },
            { value: "<50ms", label: "P50 Latency" },
            { value: "0%", label: "Error Rate" },
            { value: "1M+", label: "Events Processed" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {stat.value}
              </p>
              <p className="text-xs text-slate-400 font-medium tracking-wide uppercase mt-0.5">
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
