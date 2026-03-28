"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { io } from "socket.io-client";

// =============================================================================
// Meridian — Live Price Provider
// =============================================================================
// Subscribes to the admin WebSocket stream and exposes per-product multipliers
// to any component in the tree. ProductCard reads from this to show live prices.
// =============================================================================

interface PriceState {
  [productId: string]: {
    multiplier: number;
    direction: "up" | "down" | "none"; // for flash animation
  };
}

interface PriceContextValue {
  prices: PriceState;
  getMultiplier: (productId: string) => number;
  getDirection: (productId: string) => "up" | "down" | "none";
}

const PriceContext = createContext<PriceContextValue | null>(null);

export function useLivePrices(): PriceContextValue {
  const ctx = useContext(PriceContext);
  if (!ctx) throw new Error("useLivePrices must be used within <PriceProvider>");
  return ctx;
}

export function PriceProvider({ children }: { children: React.ReactNode }) {
  const [prices, setPrices] = useState<PriceState>({});
  const directionTimers = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const socket = io(`${apiUrl}/admin-stream`, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
    });

    socket.on("price_chart_update", (data: { product_id: string; multiplier: number }) => {
      const { product_id, multiplier } = data;

      setPrices((prev) => {
        const oldMultiplier = prev[product_id]?.multiplier ?? 1.0;
        const direction: "up" | "down" | "none" =
          multiplier > oldMultiplier + 0.001 ? "up" :
          multiplier < oldMultiplier - 0.001 ? "down" : "none";

        // Clear previous reset timer
        if (directionTimers.current[product_id]) {
          clearTimeout(directionTimers.current[product_id]);
        }

        // Reset direction after 1.5s
        if (direction !== "none") {
          directionTimers.current[product_id] = setTimeout(() => {
            setPrices((p) => ({
              ...p,
              [product_id]: { ...p[product_id], direction: "none" },
            }));
          }, 1500);
        }

        return {
          ...prev,
          [product_id]: { multiplier, direction },
        };
      });
    });

    return () => {
      socket.disconnect();
      Object.values(directionTimers.current).forEach(clearTimeout);
    };
  }, []);

  const getMultiplier = useCallback(
    (productId: string) => prices[productId]?.multiplier ?? 1.0,
    [prices]
  );

  const getDirection = useCallback(
    (productId: string) => prices[productId]?.direction ?? "none",
    [prices]
  );

  return (
    <PriceContext.Provider value={{ prices, getMultiplier, getDirection }}>
      {children}
    </PriceContext.Provider>
  );
}
