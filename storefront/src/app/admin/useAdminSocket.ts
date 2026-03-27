"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

// =============================================================================
// Meridian Admin — WebSocket Hook
// =============================================================================

export interface TelemetryEvent {
  event_type: string;
  session_id?: string;
  product_id?: string;
  payload?: Record<string, unknown>;
  timestamp?: string | number;
  raw?: string;
}

export interface AgentThought {
  step: "TRIGGER" | "RETRIEVAL" | "REASONING" | "DECISION";
  message: string;
  product_id?: string;
  timestamp?: number;
}

export interface PriceUpdate {
  product_id: string;
  multiplier: number;
  timestamp: string;
}

export interface TrafficBucket {
  time: string;
  ts: number;           // epoch ms — used for rolling window filter
  demand: number;       // page_view + cart_addition + dwell_time
  interventions: number; // competitor_price_sim + inventory_drop_sim
}

const MAX_EVENTS = 200;
const MAX_CHART_POINTS = 500;
const BUCKET_INTERVAL_MS = 4000; // aggregate every 4s
const ROLLING_WINDOW_MS = 90 * 60 * 1000; // 90 minutes
const MAX_BUCKETS = 1350; // 90 min / 4s per bucket

const DEMAND_EVENTS = new Set(["page_view", "cart_addition", "dwell_time_seconds"]);
const INTERVENTION_EVENTS = new Set(["competitor_price_sim", "inventory_drop_sim"]);

export function useAdminSocket() {
  const [telemetry, setTelemetry] = useState<TelemetryEvent[]>([]);
  const [thoughts, setThoughts] = useState<AgentThought[]>([
    {
      step: "TRIGGER",
      message: "🟢 RevOps Auditor connected. Listening for ML telemetry...",
      product_id: "SYSTEM",
      timestamp: 0,
    },
  ]);
  const [priceHistory, setPriceHistory] = useState<PriceUpdate[]>(
    ["prod_001", "prod_002", "prod_003", "prod_004", "prod_005"].map((pid) => ({
      product_id: pid,
      multiplier: 1.0,
      timestamp: "",
    }))
  );
  const [trafficBuckets, setTrafficBuckets] = useState<TrafficBucket[]>([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Counters for current bucket
  const bucketRef = useRef({ demand: 0, interventions: 0 });

  const handlePriceUpdate = useCallback((data: PriceUpdate) => {
    setPriceHistory((prev) => [...prev.slice(-(MAX_CHART_POINTS * 5 - 1)), data]);
  }, []);

  // Traffic bucketing interval + 90-min rolling window prune
  useEffect(() => {
    const interval = setInterval(() => {
      const { demand, interventions } = bucketRef.current;
      const now = Date.now();
      if (demand > 0 || interventions > 0) {
        const bucket: TrafficBucket = {
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          ts: now,
          demand,
          interventions,
        };
        setTrafficBuckets((prev) => {
          const cutoff = now - ROLLING_WINDOW_MS;
          const pruned = prev.filter((b) => b.ts > cutoff);
          return [...pruned.slice(-(MAX_BUCKETS - 1)), bucket];
        });
        bucketRef.current = { demand: 0, interventions: 0 };
      }
    }, BUCKET_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const socket = io(`${apiUrl}/admin-stream`, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", (err) =>
      console.error("[useAdminSocket] Connection error:", err.message)
    );

    socket.on("live_telemetry", (data: TelemetryEvent) => {
      const product_id =
        data.product_id || (data.payload?.product_id as string) || undefined;

      // Increment traffic bucket counters
      if (DEMAND_EVENTS.has(data.event_type)) bucketRef.current.demand++;
      if (INTERVENTION_EVENTS.has(data.event_type)) bucketRef.current.interventions++;

      setTelemetry((prev) => [
        ...prev.slice(-(MAX_EVENTS - 1)),
        { ...data, product_id, timestamp: data.timestamp ?? Date.now() / 1000 },
      ]);
    });

    socket.on("agent_thought", (data: AgentThought) => {
      setThoughts((prev) => [
        ...prev.slice(-(MAX_EVENTS - 1)),
        { ...data, timestamp: data.timestamp ?? Date.now() / 1000 },
      ]);
    });

    socket.on("price_chart_update", (data: PriceUpdate) => {
      handlePriceUpdate(data);
    });

    return () => { socket.disconnect(); };
  }, [handlePriceUpdate]);

  return { telemetry, thoughts, priceHistory, trafficBuckets, connected };
}
