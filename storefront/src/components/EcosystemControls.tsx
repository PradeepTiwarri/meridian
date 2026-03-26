"use client";

import React, { useState } from "react";
import { useTelemetryContext } from "@/providers/TelemetryProvider";
import { products } from "@/lib/products";

// =============================================================================
// Meridian Storefront — Ecosystem Controls (Demo Panel)
// =============================================================================
// A discreet floating panel for portfolio demonstrations.
// Allows manual simulation of ecosystem events that trigger telemetry.
// =============================================================================

export function EcosystemControls() {
  const { trackCompetitorPriceSim, trackInventoryDropSim, sessionId } = useTelemetryContext();
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const showFeedback = (message: string) => {
    setLastAction(message);
    setTimeout(() => setLastAction(null), 4000);
  };

  const handleCompetitorDrop = () => {
    const target = products[Math.floor(Math.random() * products.length)];
    const dropPercent = Math.round(15 + Math.random() * 15);
    const competitorPrice = Math.round(
      target.basePrice * ((100 - dropPercent) / 100)
    );

    trackCompetitorPriceSim(competitorPrice, target.id);
    showFeedback(
      `CompetitorX dropped "${target.name}" by ${dropPercent}% → $${(competitorPrice / 100).toLocaleString()}`
    );
  };

  const handleLowStock = () => {
    const target = products[Math.floor(Math.random() * products.length)];
    const stockRemaining = Math.floor(Math.random() * 4) + 1;

    trackInventoryDropSim(target.id, stockRemaining);
    showFeedback(
      `⚠️ "${target.name}" stock dropped to ${stockRemaining} unit${stockRemaining > 1 ? "s" : ""}`
    );
  };

  return (
    <div
      id="ecosystem-controls"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 max-w-[calc(100vw-2rem)] sm:max-w-none"
    >
      {/* Toggle Button */}
      <button
        id="ecosystem-controls-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-4 py-2.5 bg-foreground text-white rounded-full text-xs font-semibold
                   shadow-lg hover:shadow-xl active:scale-[0.97]
                   focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2
                   cursor-pointer"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500" />
        </span>
        Ecosystem Controls
        <svg
          className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      </button>

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="absolute bottom-14 right-0 w-[calc(100vw-2rem)] sm:w-80 bg-card border border-card-border rounded-2xl shadow-2xl p-5 animate-in">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-6 w-1 rounded-full bg-primary" />
            <h4 className="text-sm font-bold text-foreground">
              Demo Simulation
            </h4>
          </div>

          <p className="text-xs text-muted mb-4 leading-relaxed">
            Trigger ecosystem events to simulate data flowing through the
            telemetry pipeline to the ML engine.
          </p>

          {/* Simulation Buttons */}
          <div className="flex flex-col gap-2.5">
            {/* Competitor Price Drop */}
            <button
              id="simulate-competitor-drop"
              onClick={handleCompetitorDrop}
              className="w-full flex items-center justify-center gap-2 h-10 rounded-xl
                         bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold
                         hover:from-amber-600 hover:to-orange-600 active:scale-[0.97]
                         focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:ring-offset-2
                         cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
              Simulate Competitor Price Drop
            </button>

            {/* Low Stock Simulation */}
            <button
              id="simulate-low-stock"
              onClick={handleLowStock}
              className="w-full flex items-center justify-center gap-2 h-10 rounded-xl
                         bg-gradient-to-r from-red-500 to-rose-500 text-white text-sm font-semibold
                         hover:from-red-600 hover:to-rose-600 active:scale-[0.97]
                         focus:outline-none focus:ring-2 focus:ring-red-400/50 focus:ring-offset-2
                         cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Simulate Low Stock
            </button>
          </div>

          {/* Status feedback */}
          {lastAction && (
            <div className="mt-3 p-3 bg-accent rounded-xl border border-primary/20">
              <p className="text-xs text-primary font-medium flex items-center gap-1.5">
                <span className="text-sm">📡</span>
                {lastAction}
              </p>
            </div>
          )}

          {/* Session info */}
          <div className="mt-4 pt-3 border-t border-card-border">
            <p className="text-[10px] text-muted-foreground font-mono truncate">
              Session: {sessionId}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
