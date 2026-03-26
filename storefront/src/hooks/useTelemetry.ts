"use client";

import { useCallback } from "react";
import type { TelemetryEvent, TelemetryPayload } from "@/lib/types";

// =============================================================================
// Meridian Storefront — useTelemetry Hook
// =============================================================================
// Core fire-and-forget telemetry emitter.
//
// Strategy:
//   1. Primary   → navigator.sendBeacon()  (works even during page unload)
//   2. Fallback  → un-awaited fetch() with { keepalive: true }
//
// The user experience is NEVER blocked by telemetry emission.
// =============================================================================

const TELEMETRY_ENDPOINT = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/telemetry`;

/**
 * Sends a telemetry payload using fire-and-forget fetch.
 * Uses keepalive: true so the request completes even during page unload.
 */
function emitTelemetry(payload: TelemetryPayload): void {
  fetch(TELEMETRY_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch((error) => console.error("Telemetry dispatch failed:", error));
}

// =============================================================================
// Hook
// =============================================================================

export function useTelemetry(sessionId: string) {
  /**
   * Generic event tracker — builds the strict TelemetryPayload envelope
   * and fires it asynchronously.
   */
  const trackEvent = useCallback(
    (event: TelemetryEvent) => {
      const { event_type, ...rest } = event;

      const payload: TelemetryPayload = {
        event_type,
        session_id: sessionId,
        timestamp: new Date().toISOString(),
        payload: rest,
      };

      emitTelemetry(payload);
    },
    [sessionId]
  );

  // -------------------------------------------------------------------------
  // Convenience wrappers
  // -------------------------------------------------------------------------

  const trackPageView = useCallback(
    (page: string) => {
      trackEvent({ event_type: "page_view", page });
    },
    [trackEvent]
  );

  const trackDwellTime = useCallback(
    (seconds: number, page: string, productId?: string) => {
      trackEvent({
        event_type: "dwell_time_seconds",
        seconds,
        page,
        ...(productId ? { product_id: productId } : {}),
      });
    },
    [trackEvent]
  );

  const trackCartAddition = useCallback(
    (
      productId: string,
      productSku: string,
      currentPrice: number,
      action: "add_to_cart" | "generate_quote"
    ) => {
      trackEvent({
        event_type: "cart_addition",
        product_id: productId,
        product_sku: productSku,
        current_price: currentPrice,
        action,
      });
    },
    [trackEvent]
  );

  const trackCompetitorPriceSim = useCallback(
    (competitorPrice: number, affectedProductId: string) => {
      trackEvent({
        event_type: "competitor_price_sim",
        competitor_name: "CompetitorX",
        competitor_price: competitorPrice,
        affected_product_id: affectedProductId,
      });
    },
    [trackEvent]
  );

  const trackInventoryDropSim = useCallback(
    (productId: string, stockRemaining: number) => {
      trackEvent({
        event_type: "inventory_drop_sim",
        product_id: productId,
        stock_remaining: stockRemaining,
      });
    },
    [trackEvent]
  );

  return {
    trackEvent,
    trackPageView,
    trackDwellTime,
    trackCartAddition,
    trackCompetitorPriceSim,
    trackInventoryDropSim,
  };
}
