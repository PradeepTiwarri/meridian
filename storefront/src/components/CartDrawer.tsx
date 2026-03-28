"use client";

import React, { useState, useEffect } from "react";
import { useCart } from "@/providers/CartProvider";
import { useLivePrices } from "@/providers/PriceProvider";
import { formatPrice } from "@/lib/products";

// =============================================================================
// Meridian Storefront — Cart Drawer with Checkout Flow
// =============================================================================

type CheckoutPhase = "cart" | "processing" | "success";

export function CartDrawer({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { items, totalItems, removeFromCart, clearCart } = useCart();
  const { getMultiplier } = useLivePrices();
  const [phase, setPhase] = useState<CheckoutPhase>("cart");

  // Reset phase when drawer opens
  useEffect(() => {
    if (isOpen) setPhase("cart");
  }, [isOpen]);

  // Compute live total
  const liveTotal = items.reduce((sum, item) => {
    const multiplier = getMultiplier(item.product.id);
    return sum + Math.round(item.product.basePrice * multiplier) * item.quantity;
  }, 0);

  const handleCheckout = () => {
    setPhase("processing");

    // Simulate payment processing
    setTimeout(() => {
      setPhase("success");

      // Auto-close after 3 seconds
      setTimeout(() => {
        clearCart();
        setPhase("cart");
        onClose();
      }, 3000);
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
        onClick={() => phase === "cart" && onClose()}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 z-50 w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">
            {phase === "success" ? "Order Complete" : "Your Cart"}
          </h2>
          {phase === "cart" && (
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* ─── Success Phase ──────────────────────────── */}
          {phase === "success" && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 -mt-8">
              <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center">
                <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900">
                Payment Successful!
              </h3>
              <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
                Your optimized price has been locked in. A confirmation
                has been sent to your account.
              </p>
              <div className="mt-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200">
                <p className="text-sm font-bold text-emerald-700">
                  Total: {formatPrice(liveTotal)}
                </p>
              </div>
              <p className="text-xs text-slate-400 mt-4">
                Closing automatically...
              </p>
            </div>
          )}

          {/* ─── Processing Phase ──────────────────────── */}
          {phase === "processing" && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 -mt-8">
              <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-primary animate-spin" />
              <h3 className="text-lg font-bold text-slate-900">
                Locking in price...
              </h3>
              <p className="text-sm text-slate-500">
                Securing your optimized rate before it changes.
              </p>
            </div>
          )}

          {/* ─── Cart Phase ────────────────────────────── */}
          {phase === "cart" && (
            <>
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-3 -mt-8">
                  <svg className="w-16 h-16 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                  </svg>
                  <p className="text-sm text-slate-400 font-medium">Your cart is empty</p>
                  <p className="text-xs text-slate-300">Add services from the catalog to get started.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => {
                    const m = getMultiplier(item.product.id);
                    const liveItemPrice = Math.round(item.product.basePrice * m);
                    const hasDiscount = m < 0.995;
                    const hasSurge = m > 1.005;

                    return (
                      <div
                        key={item.product.id}
                        className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {item.product.name}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Qty: {item.quantity}
                            {(hasDiscount || hasSurge) && (
                              <span className={`ml-2 font-semibold ${hasDiscount ? "text-emerald-600" : "text-red-500"}`}>
                                {m.toFixed(3)}×
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-slate-900">
                            {formatPrice(liveItemPrice * item.quantity)}
                          </p>
                          {Math.abs(m - 1) > 0.005 && (
                            <p className="text-[10px] text-slate-400 line-through">
                              {formatPrice(item.product.basePrice * item.quantity)}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {phase === "cart" && items.length > 0 && (
          <div className="border-t border-slate-200 px-6 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">Total</span>
              <span className="text-xl font-extrabold text-slate-900">
                {formatPrice(liveTotal)}
              </span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full h-11 rounded-xl bg-primary text-white text-sm font-semibold
                         hover:bg-primary-hover active:scale-[0.97]
                         focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2
                         transition-all cursor-pointer"
            >
              Proceed to Checkout
            </button>
            <button
              onClick={clearCart}
              className="w-full text-xs text-slate-400 hover:text-red-500 transition-colors cursor-pointer py-1"
            >
              Clear cart
            </button>
          </div>
        )}
      </div>
    </>
  );
}
