"use client";

import React from "react";
import { products } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { Navbar } from "@/components/Navbar";
import { EcosystemControls } from "@/components/EcosystemControls";
import { AboutArchitecture } from "@/components/AboutArchitecture";
import { TelemetryProvider } from "@/providers/TelemetryProvider";
import { CartProvider } from "@/providers/CartProvider";
import Link from "next/link";

// =============================================================================
// Meridian Storefront — Catalog Page
// =============================================================================
// This is the primary product catalog. It wraps children in:
//   CartProvider → TelemetryProvider
// TelemetryProvider auto-fires page_view & dwell_time events.
// =============================================================================

export default function CatalogPage() {
  return (
    <CartProvider>
      <TelemetryProvider page="catalog">
        <Navbar />

        <main className="flex-1">
          {/* Hero Section */}
          <section className="relative overflow-hidden bg-gradient-to-br from-accent via-background to-primary-light">
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-24">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                    </span>
                    Live Dynamic Pricing
                  </span>
                </div>
                <h1 className="text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight leading-[1.1]">
                  Infrastructure that{" "}
                  <span className="text-primary">scales</span> with your
                  ambition
                </h1>
                <p className="mt-4 text-lg text-muted leading-relaxed max-w-xl">
                  Enterprise-grade cloud services with real-time ML-driven
                  pricing. Every quote is optimized by our Meridian Pricing
                  Engine in under 50ms.
                </p>
                <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-success" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.06l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                    99.99% SLA
                  </span>
                  <span className="text-card-border">|</span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-success" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.06l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                    SOC 2 Compliant
                  </span>
                  <span className="text-card-border">|</span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-success" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.06l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                    24/7 Support
                  </span>
                </div>
                <div className="mt-8">
                  <Link
                    href="/architecture"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group"
                  >
                    Read the full architecture breakdown
                    <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
            {/* Decorative gradient blob */}
            <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
          </section>

          {/* Product Catalog Grid */}
          <section id="catalog" className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  Product Catalog
                </h2>
                <p className="text-sm text-muted mt-1">
                  {products.length} services available · Prices update in
                  real-time
                </p>
              </div>

              {/* Filter pills */}
              <div className="hidden lg:flex items-center gap-2">
                {["All", "Infrastructure", "Compute", "Storage", "Platform", "Data"].map(
                  (cat) => (
                    <button
                      key={cat}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer
                        ${
                          cat === "All"
                            ? "bg-primary text-white"
                            : "bg-badge-bg text-badge-text hover:bg-card-border"
                        }`}
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>

          {/* About / How It Works — Architecture */}
          <AboutArchitecture />

          {/* Trust bar */}
          <section className="border-t border-card-border bg-card">
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
              <p className="text-center text-xs text-muted-foreground mb-6 uppercase tracking-widest font-semibold">
                Powering the infrastructure behind
              </p>
              <div className="flex items-center justify-center gap-6 sm:gap-12 flex-wrap opacity-40">
                {["Stripe", "Vercel", "Supabase", "Linear", "Resend"].map(
                  (brand) => (
                    <span
                      key={brand}
                      className="text-lg font-bold text-foreground tracking-tight"
                    >
                      {brand}
                    </span>
                  )
                )}
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-card-border bg-card">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center h-6 w-6 rounded-lg bg-primary text-white font-black text-[10px]">
                M
              </div>
              <span className="text-sm font-semibold text-foreground">
                Meridian
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              © 2026 Meridian Ecosystem · Dynamic Pricing Platform
            </p>
          </div>
        </footer>

        {/* Floating Demo Controls */}
        <EcosystemControls />
      </TelemetryProvider>
    </CartProvider>
  );
}
