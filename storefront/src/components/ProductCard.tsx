"use client";

import React, { useState, useRef, useCallback } from "react";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/products";
import { useTelemetryContext } from "@/providers/TelemetryProvider";
import { useCart } from "@/providers/CartProvider";
import { QuoteModal } from "./QuoteModal";

// =============================================================================
// Meridian Storefront — ProductCard Component
// =============================================================================

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// Category → icon mapping
const categoryIcons: Record<string, string> = {
  Infrastructure: "🌐",
  Storage: "💾",
  Compute: "⚡",
  Platform: "🔧",
  Data: "📊",
};

// Tier → color mapping
const tierColors: Record<string, string> = {
  Enterprise: "bg-amber-50 text-amber-700 border-amber-200",
  Standard: "bg-blue-50 text-blue-700 border-blue-200",
  Premium: "bg-purple-50 text-purple-700 border-purple-200",
};

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { trackCartAddition, trackDwellTime } = useTelemetryContext();
  const { addToCart } = useCart();

  // Hover dwell tracking
  const hoverStartRef = useRef<number>(0);

  const handleMouseEnter = useCallback(() => {
    hoverStartRef.current = Date.now();
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (hoverStartRef.current > 0) {
      const seconds = (Date.now() - hoverStartRef.current) / 1000;
      if (seconds >= 1) { // Only fire if hovered for ≥1s
        trackDwellTime(Math.round(seconds), "products", product.id);
      }
      hoverStartRef.current = 0;
    }
  }, [trackDwellTime, product.id]);

  // Quote modal state
  const [quoteData, setQuoteData] = useState<any>(null);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);

  const handleAddToCart = () => {
    addToCart(product);
    trackCartAddition(product.id, product.sku, product.basePrice, "add_to_cart");
  };

  const handleGenerateQuote = async () => {
    // Fire telemetry
    trackCartAddition(product.id, product.sku, product.basePrice, "generate_quote");

    // Open modal in loading state
    setIsQuoteOpen(true);
    setIsQuoteLoading(true);
    setQuoteData(null);

    try {
      const res = await fetch(`${BACKEND_URL}/checkout/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: product.id,
          quantity: 1,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setQuoteData(data);
    } catch (err) {
      console.error("Quote generation failed:", err);
      // Show fallback with base price
      setQuoteData({
        product_id: product.id,
        product_name: product.name,
        sku: product.sku,
        quantity: 1,
        base_price: product.basePrice,
        base_price_display: formatPrice(product.basePrice),
        applied_multiplier: 1.0,
        multiplier_source: "default",
        adjustment_percent: "+0.0%",
        adjustment_label: "No adjustment",
        final_price: product.basePrice,
        final_price_display: formatPrice(product.basePrice),
        savings_or_surge_amount: 0,
        savings_or_surge_display: "$0.00",
      });
    } finally {
      setIsQuoteLoading(false);
    }
  };

  return (
    <>
      <div
        id={`product-card-${product.id}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="group relative flex flex-col bg-card border border-card-border rounded-2xl p-6 hover:shadow-lg hover:border-primary/30 hover:-translate-y-1"
      >
        {/* Category icon + tier badge */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-2xl" role="img" aria-label={product.category}>
            {categoryIcons[product.category] || "📦"}
          </span>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
              tierColors[product.tier] || "bg-badge-bg text-badge-text"
            }`}
          >
            {product.tier}
          </span>
        </div>

        {/* Product info */}
        <h3 className="text-lg font-bold text-foreground mb-1 leading-snug">
          {product.name}
        </h3>
        <p className="text-sm text-muted leading-relaxed mb-4 flex-1">
          {product.description}
        </p>

        {/* SKU */}
        <p className="text-xs text-muted-foreground font-mono mb-3">
          SKU: {product.sku}
        </p>

        {/* Price */}
        <div className="flex items-baseline gap-1 mb-5">
          <span className="text-2xl font-extrabold text-foreground tracking-tight">
            {formatPrice(product.basePrice)}
          </span>
          <span className="text-xs text-muted-foreground">/mo</span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            id={`add-to-cart-${product.id}`}
            onClick={handleAddToCart}
            className="flex-1 h-10 rounded-xl bg-primary text-white text-sm font-semibold
                       hover:bg-primary-hover active:scale-[0.97]
                       focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2
                       cursor-pointer"
          >
            Add to Cart
          </button>
          <button
            id={`generate-quote-${product.id}`}
            onClick={handleGenerateQuote}
            disabled={isQuoteLoading}
            className="flex-1 h-10 rounded-xl border border-primary/30 text-primary text-sm font-semibold
                       hover:bg-accent active:scale-[0.97]
                       focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2
                       cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isQuoteLoading ? "Loading..." : "Generate Quote"}
          </button>
        </div>

        {/* Subtle hover glow */}
        <div className="absolute inset-0 rounded-2xl bg-primary/[0.02] opacity-0 group-hover:opacity-100 pointer-events-none" />
      </div>

      {/* Quote Modal */}
      <QuoteModal
        quote={quoteData}
        isOpen={isQuoteOpen}
        isLoading={isQuoteLoading}
        onClose={() => setIsQuoteOpen(false)}
      />
    </>
  );
}

