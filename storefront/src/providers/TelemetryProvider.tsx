"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { useTelemetry } from "@/hooks/useTelemetry";
import type { TelemetryContextValue } from "@/lib/types";

// =============================================================================
// Meridian Storefront — TelemetryProvider
// =============================================================================
// Wraps the application to provide:
//   • A stable session_id (generated once on mount)
//   • Automatic page_view event on mount
//   • Automatic dwell_time_seconds events every 10 seconds
//   • Clean teardown + final dwell_time on unmount
//   • Exposed tracking methods via React Context
// =============================================================================

/**
 * Generates a UUID v4 string.
 * Uses crypto.randomUUID() where available, otherwise falls back to manual.
 */
function generateSessionId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const TelemetryContext = createContext<TelemetryContextValue | null>(null);

/**
 * Hook to consume telemetry context from any child component.
 */
export function useTelemetryContext(): TelemetryContextValue {
  const ctx = useContext(TelemetryContext);
  if (!ctx) {
    throw new Error(
      "useTelemetryContext must be used within a <TelemetryProvider>"
    );
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface TelemetryProviderProps {
  children: React.ReactNode;
  page?: string; // defaults to "catalog"
}

export function TelemetryProvider({
  children,
  page = "catalog",
}: TelemetryProviderProps) {
  // Stable session ID — generated once and never changes
  const [sessionId] = useState<string>(generateSessionId);

  const telemetry = useTelemetry(sessionId);
  const mountTimestamp = useRef<number>(Date.now());
  const dwellAccumulator = useRef<number>(0);

  // -------------------------------------------------------------------------
  // Auto: page_view on mount
  // -------------------------------------------------------------------------
  useEffect(() => {
    telemetry.trackPageView(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally fire only once on mount

  // -------------------------------------------------------------------------
  // Auto: dwell_time_seconds every 10 seconds + final on unmount
  // -------------------------------------------------------------------------
  useEffect(() => {
    const interval = setInterval(() => {
      dwellAccumulator.current += 10;
      telemetry.trackDwellTime(dwellAccumulator.current, page);
    }, 10_000);

    return () => {
      clearInterval(interval);

      // Final dwell time on unmount
      const totalSeconds = Math.round(
        (Date.now() - mountTimestamp.current) / 1000
      );
      telemetry.trackDwellTime(totalSeconds, page);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Stable refs — no deps needed

  // -------------------------------------------------------------------------
  // Contextual wrappers (stable references via useCallback)
  // -------------------------------------------------------------------------
  const trackPageView = useCallback(
    (p: string) => telemetry.trackPageView(p),
    [telemetry]
  );

  const trackDwellTime = useCallback(
    (seconds: number, p: string, productId?: string) =>
      telemetry.trackDwellTime(seconds, p, productId),
    [telemetry]
  );

  const trackCartAddition = useCallback(
    (
      productId: string,
      productSku: string,
      currentPrice: number,
      action: "add_to_cart" | "generate_quote"
    ) => telemetry.trackCartAddition(productId, productSku, currentPrice, action),
    [telemetry]
  );

  const trackCompetitorPriceSim = useCallback(
    (competitorPrice: number, affectedProductId: string) =>
      telemetry.trackCompetitorPriceSim(competitorPrice, affectedProductId),
    [telemetry]
  );

  const trackInventoryDropSim = useCallback(
    (productId: string, stockRemaining: number) =>
      telemetry.trackInventoryDropSim(productId, stockRemaining),
    [telemetry]
  );

  // -------------------------------------------------------------------------
  // Provide
  // -------------------------------------------------------------------------
  const value: TelemetryContextValue = {
    sessionId,
    trackPageView,
    trackDwellTime,
    trackCartAddition,
    trackCompetitorPriceSim,
    trackInventoryDropSim,
  };

  return (
    <TelemetryContext.Provider value={value}>
      {children}
    </TelemetryContext.Provider>
  );
}
