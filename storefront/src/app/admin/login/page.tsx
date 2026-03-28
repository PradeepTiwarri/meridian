"use client";

import React, { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

// =============================================================================
// Admin Login — Split-screen Enterprise Design
// =============================================================================

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      {/* ═══════════════════════════════════════════════════════
          LEFT — Brand Panel
          ═══════════════════════════════════════════════════════ */}
      <div className="relative flex-1 flex flex-col justify-between overflow-hidden bg-[#0a0f1a] px-8 py-10 lg:px-16 lg:py-14">
        {/* Tech grid background */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        {/* Gradient orbs */}
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-teal-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[400px] h-[400px] rounded-full bg-emerald-600/8 blur-[100px] pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-teal-600 text-white font-black text-sm">
              M
            </div>
            <span className="text-sm font-bold text-white/90 group-hover:text-white transition-colors">
              Meridian
            </span>
          </Link>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-2 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[11px] font-semibold text-emerald-400 tracking-widest uppercase">
              System Online
            </span>
          </div>

          <h1 className="text-3xl lg:text-[40px] font-extrabold text-white tracking-tight leading-[1.15] mb-4">
            Command Center
            <br />
            <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              Access
            </span>
          </h1>

          <p className="text-[15px] text-slate-400 leading-relaxed">
            Monitor the ML pricing engine in real-time. Review multiplier
            decisions, audit the RevOps agent, and govern your dynamic
            pricing pipeline from a single pane of glass.
          </p>

          {/* Feature bullets */}
          <div className="mt-8 space-y-3">
            {[
              "Live Recharts dashboards via WebSocket",
              "RevOps AI agent audit trail",
              "Per-product price lock overrides",
            ].map((f) => (
              <div key={f} className="flex items-center gap-2.5">
                <svg className="w-4 h-4 text-teal-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                <span className="text-sm text-slate-500">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-[11px] text-slate-600">
            © 2026 Meridian Ecosystem · Authorized access only
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          RIGHT — Login Form
          ═══════════════════════════════════════════════════════ */}
      <div className="flex-1 flex items-center justify-center bg-white px-8 py-16 lg:px-16">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Sign in
            </h2>
            <p className="text-sm text-slate-500 mt-1.5">
              Enter your admin credentials to continue
            </p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-[13px] font-medium text-slate-700 mb-1.5"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                autoComplete="email"
                className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white
                           text-sm text-slate-900 placeholder:text-slate-400
                           focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500
                           transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-[13px] font-medium text-slate-700"
                >
                  Password
                </label>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                required
                autoComplete="current-password"
                className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white
                           text-sm text-slate-900 placeholder:text-slate-400
                           focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500
                           transition-all"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg bg-slate-900 hover:bg-slate-800
                         text-white text-sm font-semibold
                         active:scale-[0.98] transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed
                         cursor-pointer"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Authenticating...
                </span>
              ) : (
                "Continue"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-400 text-center">
              Protected by Supabase Auth ·{" "}
              <Link href="/" className="text-slate-500 hover:text-slate-700 transition-colors">
                Back to Storefront
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
