"use client";

import React from "react";

// =============================================================================
// Meridian Storefront — Quote Modal
// =============================================================================
// Professional modal displaying the dynamic pricing breakdown:
//   • Base Price
//   • Market Adjustment (with label + percentage)
//   • Final Dynamically Calculated Price
//   • Savings or Surge amount
// =============================================================================

interface QuoteData {
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  base_price: number;
  base_price_display: string;
  applied_multiplier: number;
  multiplier_source: string;
  adjustment_percent: string;
  adjustment_label: string;
  final_price: number;
  final_price_display: string;
  savings_or_surge_amount: number;
  savings_or_surge_display: string;
}

interface QuoteModalProps {
  quote: QuoteData | null;
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
}

export function QuoteModal({ quote, isOpen, isLoading, onClose }: QuoteModalProps) {
  if (!isOpen) return null;

  const isSurge = quote ? quote.savings_or_surge_amount > 0 : false;
  const isDiscount = quote ? quote.savings_or_surge_amount < 0 : false;

  return (
    <div
      id="quote-modal-overlay"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-500 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-100 text-xs font-medium tracking-wide uppercase">
                Dynamic Quote
              </p>
              <h3 className="text-white text-lg font-bold mt-0.5">
                {isLoading ? "Calculating..." : quote?.product_name || "Quote"}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 cursor-pointer"
            >
              ✕
            </button>
          </div>
          {quote && (
            <p className="text-teal-200 text-xs font-mono mt-1">
              SKU: {quote.sku} · Qty: {quote.quantity}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          {isLoading ? (
            <div className="flex flex-col items-center py-8 gap-3">
              <div className="w-8 h-8 border-3 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
              <p className="text-sm text-slate-500">
                Fetching live market price...
              </p>
            </div>
          ) : quote ? (
            <div className="space-y-4">
              {/* Base Price */}
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <div>
                  <p className="text-sm font-medium text-slate-700">Base Price</p>
                  <p className="text-xs text-slate-400">Catalog list price</p>
                </div>
                <p className="text-lg font-bold text-slate-800">
                  {quote.base_price_display}
                </p>
              </div>

              {/* Market Adjustment */}
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Market Adjustment
                  </p>
                  <p className="text-xs text-slate-400">
                    {quote.adjustment_label}
                    {quote.multiplier_source === "ml_predicted" && (
                      <span className="ml-1 text-teal-600">· ML Predicted</span>
                    )}
                  </p>
                </div>
                <span
                  className={`text-sm font-bold px-2.5 py-1 rounded-full ${
                    isSurge
                      ? "bg-amber-50 text-amber-700"
                      : isDiscount
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-50 text-slate-600"
                  }`}
                >
                  {quote.adjustment_percent}
                </span>
              </div>

              {/* Savings/Surge */}
              {quote.savings_or_surge_amount !== 0 && (
                <div className="flex items-center justify-between py-2">
                  <p className="text-xs text-slate-500">
                    {isSurge ? "Demand surge" : "You save"}
                  </p>
                  <p
                    className={`text-sm font-semibold ${
                      isSurge ? "text-amber-600" : "text-emerald-600"
                    }`}
                  >
                    {quote.savings_or_surge_display}
                  </p>
                </div>
              )}

              {/* Divider */}
              <div className="border-t-2 border-teal-100" />

              {/* Final Price */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <p className="text-base font-bold text-slate-800">
                    Final Price
                  </p>
                  <p className="text-xs text-teal-600 font-medium">
                    Real-time dynamic pricing applied
                  </p>
                </div>
                <p className="text-2xl font-extrabold text-teal-700 tracking-tight">
                  {quote.final_price_display}
                </p>
              </div>

              {/* Multiplier badge */}
              <div className="flex items-center justify-center pt-2">
                <span className="text-[10px] text-slate-400 bg-slate-50 px-3 py-1 rounded-full font-mono">
                  Multiplier: {quote.applied_multiplier.toFixed(4)}x ·{" "}
                  {quote.multiplier_source}
                </span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 h-10 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold
                         hover:bg-slate-100 active:scale-[0.97] cursor-pointer"
            >
              Close
            </button>
            <button
              className="flex-1 h-10 rounded-xl bg-teal-600 text-white text-sm font-semibold
                         hover:bg-teal-700 active:scale-[0.97] cursor-pointer"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
