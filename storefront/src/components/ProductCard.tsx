"use client";

import React, { useRef, useCallback } from "react";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/products";
import { useTelemetryContext } from "@/providers/TelemetryProvider";
import { useCart } from "@/providers/CartProvider";
import { useLivePrices } from "@/providers/PriceProvider";

// =============================================================================
// Meridian Storefront — ProductCard with Live Pricing
// =============================================================================

const categoryIcons: Record<string, string> = {
  Infrastructure: "🌐",
  Storage: "💾",
  Compute: "⚡",
  Platform: "🔧",
  Data: "📊",
};

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
  const { getMultiplier, getDirection } = useLivePrices();

  const hoverStartRef = useRef<number>(0);

  const handleMouseEnter = useCallback(() => {
    hoverStartRef.current = Date.now();
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (hoverStartRef.current > 0) {
      const seconds = (Date.now() - hoverStartRef.current) / 1000;
      if (seconds >= 1) {
        trackDwellTime(Math.round(seconds), "products", product.id);
      }
      hoverStartRef.current = 0;
    }
  }, [trackDwellTime, product.id]);

  const handleAddToCart = () => {
    addToCart(product);
    trackCartAddition(product.id, product.sku, product.basePrice, "add_to_cart");
  };

  // Live price
  const multiplier = getMultiplier(product.id);
  const direction = getDirection(product.id);
  const livePrice = Math.round(product.basePrice * multiplier);
  const hasChanged = Math.abs(multiplier - 1.0) > 0.005;

  // Direction-based color flash
  const priceColor =
    direction === "down"
      ? "text-emerald-600"
      : direction === "up"
        ? "text-red-500"
        : "text-foreground";

  // Multiplier badge
  const multiplierLabel =
    multiplier >= 1.005
      ? `+${((multiplier - 1) * 100).toFixed(1)}%`
      : multiplier <= 0.995
        ? `${((multiplier - 1) * 100).toFixed(1)}%`
        : null;

  return (
    <div
      id={`product-card-${product.id}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative flex flex-col bg-card border border-card-border rounded-2xl p-6 hover:shadow-lg hover:border-primary/30 hover:-translate-y-1 transition-all duration-200"
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

      {/* Live Price */}
      <div className="flex items-baseline gap-2 mb-5">
        <span
          className={`text-2xl font-extrabold tracking-tight transition-colors duration-300 ${priceColor}`}
        >
          {formatPrice(livePrice)}
        </span>
        <span className="text-xs text-muted-foreground">/mo</span>
        {multiplierLabel && (
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              multiplier > 1
                ? "bg-red-50 text-red-600"
                : "bg-emerald-50 text-emerald-600"
            }`}
          >
            {multiplierLabel}
          </span>
        )}
      </div>

      {/* Base price reference (only show if price changed) */}
      {hasChanged && (
        <p className="text-[10px] text-muted-foreground -mt-4 mb-4">
          Base: <span className="line-through">{formatPrice(product.basePrice)}</span>
          {" · "}
          <span className="text-primary font-medium">{multiplier.toFixed(3)}×</span>
        </p>
      )}

      {/* Single Add to Cart button */}
      <button
        id={`add-to-cart-${product.id}`}
        onClick={handleAddToCart}
        className="w-full h-10 rounded-xl bg-primary text-white text-sm font-semibold
                   hover:bg-primary-hover active:scale-[0.97]
                   focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2
                   transition-all cursor-pointer"
      >
        Add to Cart
      </button>

      {/* Subtle hover glow */}
      <div className="absolute inset-0 rounded-2xl bg-primary/[0.02] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
    </div>
  );
}
