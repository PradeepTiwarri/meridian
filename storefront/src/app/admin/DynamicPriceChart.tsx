"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import type { PriceUpdate } from "./useAdminSocket";

// =============================================================================
// Dynamic Price Chart — Enterprise styling
// =============================================================================

const PRODUCTS = ["prod_001", "prod_002", "prod_003", "prod_004", "prod_005"];

const PRODUCT_COLORS: Record<string, string> = {
  prod_001: "#3b82f6",
  prod_002: "#8b5cf6",
  prod_003: "#06b6d4",
  prod_004: "#f59e0b",
  prod_005: "#ef4444",
};

const PRODUCT_LABELS: Record<string, string> = {
  prod_001: "API Gateway",
  prod_002: "Cloud Storage",
  prod_003: "GPU Cluster",
  prod_004: "Data Pipeline",
  prod_005: "ML Platform",
};

interface ChartPoint {
  time: string;
  [key: string]: number | string | undefined;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function DynamicPriceChart({
  priceHistory,
  activeProducts,
}: {
  priceHistory: PriceUpdate[];
  activeProducts: string[];
}) {
  const chartData = useMemo<ChartPoint[]>(() => {
    if (priceHistory.length === 0) return [];
    const latestByProduct: Record<string, number> = {};
    const points: ChartPoint[] = [];

    for (const update of priceHistory) {
      latestByProduct[update.product_id] = update.multiplier;
      const point: ChartPoint = { time: formatTime(update.timestamp) };
      for (const pid of PRODUCTS) {
        if (latestByProduct[pid] !== undefined) {
          point[pid] = latestByProduct[pid];
        }
      }
      points.push(point);
    }
    return points.slice(-500);
  }, [priceHistory]);

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 h-full">
      {/* Header — no legend needed, filter bar does it */}
      <div className="mb-3">
        <h3 className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
          Price Multipliers
        </h3>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Live Session History (500 ticks) · Safe zone 0.9×–1.1×
        </p>
      </div>

      {/* Chart */}
      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-[240px] text-slate-400">
          <div className="text-center">
            <span className="text-2xl block mb-1">📊</span>
            <p className="text-xs">Waiting for price data…</p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart
            data={chartData}
            margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 9, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={{ stroke: "#e2e8f0" }}
              interval="preserveStartEnd"
              minTickGap={50}
            />
            <YAxis
              domain={[0.8, 1.3]}
              tick={{ fontSize: 9, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v.toFixed(1)}×`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "none",
                borderRadius: "6px",
                fontSize: "11px",
                color: "#e2e8f0",
              }}
              formatter={((value: unknown) => [
                `${Number(value ?? 0).toFixed(4)}×`,
              ]) as never}
              labelStyle={{ color: "#94a3b8", fontSize: "10px" }}
            />
            <ReferenceLine y={1.1} stroke="#f59e0b" strokeDasharray="6 3" strokeWidth={1} />
            <ReferenceLine y={0.9} stroke="#f59e0b" strokeDasharray="6 3" strokeWidth={1} />
            <ReferenceLine y={1.0} stroke="#cbd5e1" strokeWidth={0.5} />

            {PRODUCTS.filter((pid) => activeProducts.includes(pid)).map((pid) => (
              <Line
                key={pid}
                type="monotone"
                dataKey={pid}
                stroke={PRODUCT_COLORS[pid]}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3, strokeWidth: 1 }}
                connectNulls
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
