"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { TrafficBucket } from "./useAdminSocket";

// =============================================================================
// Traffic Volume Chart — Demand vs Interventions (stacked bar)
// =============================================================================

export default function TrafficVolumeChart({
  trafficBuckets,
  activeProducts,
}: {
  trafficBuckets: TrafficBucket[];
  activeProducts: string[];
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 h-full">
      <h3 className="text-xs font-semibold tracking-wider text-slate-500 uppercase mb-0.5">
        Traffic Volume
      </h3>
      <p className="text-[11px] text-slate-400 mb-3">
        Events per 4s · Demand vs. interventions
      </p>

      {trafficBuckets.length === 0 ? (
        <div className="flex items-center justify-center h-[240px] text-slate-400">
          <div className="text-center">
            <span className="text-2xl block mb-1">📶</span>
            <p className="text-xs">Waiting for traffic…</p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart
            data={trafficBuckets}
            margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 9, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={{ stroke: "#e2e8f0" }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 9, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "none",
                borderRadius: "6px",
                fontSize: "11px",
                color: "#e2e8f0",
              }}
              labelStyle={{ color: "#94a3b8", fontSize: "10px" }}
            />
            <Bar
              dataKey="demand"
              name="Demand"
              fill="#3b82f6"
              radius={[3, 3, 0, 0]}
              stackId="traffic"
              isAnimationActive={false}
            />
            <Bar
              dataKey="interventions"
              name="Interventions"
              fill="#f59e0b"
              radius={[3, 3, 0, 0]}
              stackId="traffic"
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 justify-center">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-blue-500" />
          <span className="text-[10px] text-slate-500">Demand</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-amber-500" />
          <span className="text-[10px] text-slate-500">Interventions</span>
        </div>
      </div>
    </div>
  );
}
