"use client";

import { useState } from "react";
import type { PriceUpdate } from "./useAdminSocket";

// =============================================================================
// Human Override Panel — Wired to POST /admin/override
// =============================================================================

const PRODUCTS = [
  { id: "prod_001", name: "Enterprise API Gateway", short: "API Gateway", base: 2499 },
  { id: "prod_002", name: "Standard Cloud Storage", short: "Cloud Storage", base: 899 },
  { id: "prod_003", name: "Dedicated GPU Cluster",  short: "GPU Cluster",  base: 12999 },
  { id: "prod_004", name: "Real-Time Data Pipeline", short: "Data Pipeline", base: 4299 },
  { id: "prod_005", name: "ML Inference Platform",   short: "ML Platform",  base: 7499 },
];

const API_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/admin/override`;

interface LockState {
  locked: boolean;
  multiplier: number;
}

interface Toast {
  id: number;
  message: string;
  type: "lock" | "unlock" | "error";
}

export default function HumanOverridePanel({
  priceHistory,
}: {
  priceHistory: PriceUpdate[];
}) {
  const [lockStates, setLockStates] = useState<Record<string, LockState>>({});
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  // Latest ML multiplier per product
  const latestMultipliers: Record<string, number> = {};
  for (const update of priceHistory) {
    latestMultipliers[update.product_id] = update.multiplier;
  }

  function showToast(message: string, type: "lock" | "unlock" | "error") {
    const toast: Toast = { id: Date.now(), message, type };
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== toast.id)), 3500);
  }

  async function handleSetAndLock(productId: string, productName: string) {
    const mlVal = latestMultipliers[productId] ?? 1.0;
    const inputVal = parseFloat(inputs[productId] ?? "");
    const finalVal = isNaN(inputVal) ? mlVal : inputVal;

    setLoading((prev) => ({ ...prev, [productId]: true }));

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          multiplier: finalVal,
          locked: true,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setLockStates((prev) => ({
        ...prev,
        [productId]: { locked: true, multiplier: finalVal },
      }));
      showToast(
        `🔒 Override active: ${productName} locked at ${finalVal.toFixed(4)}×`,
        "lock"
      );
    } catch (err) {
      showToast(
        `❌ Failed to lock ${productName}: ${(err as Error).message}`,
        "error"
      );
    } finally {
      setLoading((prev) => ({ ...prev, [productId]: false }));
    }
  }

  async function handleUnlock(productId: string, productName: string) {
    setLoading((prev) => ({ ...prev, [productId]: true }));

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          multiplier: 1.0,
          locked: false,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setLockStates((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
      setInputs((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
      showToast(`🔓 ${productName} unlocked — AI pricing resumed`, "unlock");
    } catch (err) {
      showToast(
        `❌ Failed to unlock ${productName}: ${(err as Error).message}`,
        "error"
      );
    } finally {
      setLoading((prev) => ({ ...prev, [productId]: false }));
    }
  }

  const lockedCount = Object.values(lockStates).filter((s) => s.locked).length;

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            Manual RevOps Controls
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Set custom multiplier · Lock to freeze ML pricing · Wired to Redis
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${lockedCount > 0 ? "bg-rose-400" : "bg-emerald-400"}`} />
          <span className="text-[11px] text-slate-500 font-medium tabular-nums">
            {lockedCount} / {PRODUCTS.length} locked
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {PRODUCTS.map((product) => {
          const mlMultiplier = latestMultipliers[product.id] ?? 1.0;
          const lockState = lockStates[product.id];
          const isLocked = lockState?.locked ?? false;
          const displayMultiplier = isLocked ? lockState!.multiplier : mlMultiplier;
          const isAboveSafe = displayMultiplier > 1.1;
          const isBelowSafe = displayMultiplier < 0.9;
          const finalPrice = (product.base * displayMultiplier).toFixed(2);
          const isLoading = loading[product.id] ?? false;

          return (
            <div
              key={product.id}
              className={`rounded-lg border p-3 transition-all ${
                isLocked
                  ? "bg-rose-50/80 border-rose-300"
                  : "bg-slate-50/50 border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs font-semibold text-slate-700">{product.short}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{product.id}</p>
                </div>
                <span
                  className={`w-2 h-2 rounded-full ${
                    isLocked
                      ? "bg-rose-400"
                      : isAboveSafe || isBelowSafe
                        ? "bg-amber-400 animate-pulse"
                        : "bg-emerald-400"
                  }`}
                />
              </div>

              <p
                className={`text-xl font-bold font-mono tabular-nums text-center mb-0.5 ${
                  isLocked ? "text-rose-500" : isAboveSafe ? "text-rose-500" : isBelowSafe ? "text-blue-500" : "text-emerald-600"
                }`}
              >
                {displayMultiplier.toFixed(4)}×
              </p>
              <p className="text-[10px] text-slate-400 text-center mb-2">
                ${finalPrice}
              </p>

              {isLocked ? (
                <button
                  onClick={() => handleUnlock(product.id, product.name)}
                  disabled={isLoading}
                  className="w-full py-1.5 rounded-md text-[11px] font-semibold bg-rose-500 text-white hover:bg-rose-600 transition-colors disabled:opacity-50"
                >
                  {isLoading ? "⏳ …" : "🔒 LOCKED — Unlock"}
                </button>
              ) : (
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    step="0.01"
                    min="0.5"
                    max="2.0"
                    placeholder={mlMultiplier.toFixed(2)}
                    value={inputs[product.id] ?? ""}
                    onChange={(e) =>
                      setInputs((prev) => ({ ...prev, [product.id]: e.target.value }))
                    }
                    className="flex-1 min-w-0 px-2 py-1.5 text-[11px] font-mono rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 text-center"
                  />
                  <button
                    onClick={() => handleSetAndLock(product.id, product.name)}
                    disabled={isLoading}
                    className="px-2.5 py-1.5 rounded-md text-[11px] font-semibold bg-slate-700 text-white hover:bg-slate-800 transition-colors whitespace-nowrap disabled:opacity-50"
                  >
                    {isLoading ? "⏳" : "Set & Lock"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Toast notifications */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-3 py-2 rounded-md shadow-lg text-xs font-medium ${
              toast.type === "lock"
                ? "bg-rose-600 text-white"
                : toast.type === "unlock"
                  ? "bg-emerald-600 text-white"
                  : "bg-red-700 text-white"
            }`}
            style={{ animation: "slideIn 0.25s ease-out" }}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
