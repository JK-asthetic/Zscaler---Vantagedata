"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { PieChart as PieIcon, BarChart2, TrendingUp, Download } from "lucide-react";
import { ChartSpec } from "@/types";

interface InteractiveChartProps {
  spec: ChartSpec;
}

const PALETTE = [
  "#38bdf8", // Sky
  "#818cf8", // Indigo
  "#34d399", // Emerald
  "#fbbf24", // Amber
  "#f472b6", // Pink
  "#a78bfa", // Violet
  "#fb7185", // Rose
  "#2dd4bf", // Teal
  "#c084fc", // Purple
  "#4ade80", // Green
];

export const InteractiveChart: React.FC<InteractiveChartProps> = ({ spec }) => {
  const [chartType, setChartType] = useState<"pie" | "donut" | "bar" | "line">(spec.type || "pie");

  const data = spec.data || [];
  const totalVal = data.reduce((sum, item) => sum + (Number(item.value) || 0), 0);

  const formattedData = data.map((item, idx) => ({
    name: item.label,
    value: Number(item.value) || 0,
    percentage:
      item.percentage !== undefined && item.percentage !== null
        ? Number(item.percentage)
        : totalVal > 0
        ? Number(((Number(item.value) / totalVal) * 100).toFixed(1))
        : 0,
    color: item.color || PALETTE[idx % PALETTE.length],
  }));

  const handleExportData = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Label,Value,Percentage\n" +
      formattedData.map((d) => `"${d.name}",${d.value},${d.percentage}%`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${spec.title.replace(/\s+/g, "_").toLowerCase()}_chart.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="my-4 rounded-xl border border-zinc-800/80 bg-zinc-950/90 shadow-xl overflow-hidden text-zinc-100 font-body">
      {/* Header Bar */}
      <div className="px-4 py-3 border-b border-zinc-800/80 bg-black/40 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-cyan-950 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
            {chartType === "pie" || chartType === "donut" ? (
              <PieIcon className="w-3.5 h-3.5" />
            ) : chartType === "bar" ? (
              <BarChart2 className="w-3.5 h-3.5" />
            ) : (
              <TrendingUp className="w-3.5 h-3.5" />
            )}
          </div>
          <div>
            <h4 className="font-display font-semibold text-xs text-white tracking-tight">
              {spec.title}
            </h4>
            <p className="text-[10px] text-zinc-400 font-mono">
              {data.length} categories • Total: {totalVal.toLocaleString()}
            </p>
          </div>
        </div>

        {/* View Switcher & Export */}
        <div className="flex items-center gap-1.5 bg-zinc-900/80 p-1 rounded-lg border border-zinc-800">
          <button
            type="button"
            onClick={() => setChartType("pie")}
            className={`px-2 py-1 rounded text-[10px] font-mono flex items-center gap-1 transition-all ${
              chartType === "pie"
                ? "bg-cyan-600 text-white shadow-sm font-semibold"
                : "text-zinc-400 hover:text-white"
            }`}
            title="Pie Chart"
          >
            <PieIcon className="w-3 h-3" />
            <span>Pie</span>
          </button>
          <button
            type="button"
            onClick={() => setChartType("bar")}
            className={`px-2 py-1 rounded text-[10px] font-mono flex items-center gap-1 transition-all ${
              chartType === "bar"
                ? "bg-cyan-600 text-white shadow-sm font-semibold"
                : "text-zinc-400 hover:text-white"
            }`}
            title="Bar Chart"
          >
            <BarChart2 className="w-3 h-3" />
            <span>Bar</span>
          </button>
          <button
            type="button"
            onClick={() => setChartType("line")}
            className={`px-2 py-1 rounded text-[10px] font-mono flex items-center gap-1 transition-all ${
              chartType === "line"
                ? "bg-cyan-600 text-white shadow-sm font-semibold"
                : "text-zinc-400 hover:text-white"
            }`}
            title="Line Trend"
          >
            <TrendingUp className="w-3 h-3" />
            <span>Line</span>
          </button>
          <div className="w-[1px] h-3.5 bg-zinc-800 mx-0.5" />
          <button
            type="button"
            onClick={handleExportData}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Download CSV"
          >
            <Download className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="p-4 pt-2">
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "pie" || chartType === "donut" ? (
              <PieChart>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const p = payload[0].payload;
                      return (
                        <div className="bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg shadow-xl text-xs font-mono">
                          <div className="flex items-center gap-1.5 font-bold text-white mb-1">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: p.color }}
                            />
                            <span>{p.name}</span>
                          </div>
                          <div className="text-zinc-300">
                            Count / Value: <span className="text-white font-bold">{p.value}</span>
                          </div>
                          <div className="text-cyan-400">
                            Share: <span className="font-bold">{p.percentage}%</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Pie
                  data={formattedData}
                  cx="50%"
                  cy="50%"
                  innerRadius={chartType === "donut" ? 45 : 0}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {formattedData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="#09090b"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span className="text-zinc-300 text-[11px] font-mono">{value}</span>
                  )}
                />
              </PieChart>
            ) : chartType === "bar" ? (
              <BarChart data={formattedData} margin={{ top: 15, right: 20, left: 0, bottom: 25 }}>
                <XAxis
                  dataKey="name"
                  stroke="#71717a"
                  fontSize={10}
                  tickLine={false}
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis stroke="#71717a" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const p = payload[0].payload;
                      return (
                        <div className="bg-zinc-950 border border-zinc-800 p-2 rounded-lg shadow-xl text-xs font-mono">
                          <div className="font-bold text-white mb-0.5">{p.name}</div>
                          <div className="text-cyan-400">
                            Value: <span className="font-bold">{p.value}</span> ({p.percentage}%)
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {formattedData.map((entry, index) => (
                    <Cell key={`cell-bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <LineChart data={formattedData} margin={{ top: 15, right: 20, left: 0, bottom: 25 }}>
                <XAxis
                  dataKey="name"
                  stroke="#71717a"
                  fontSize={10}
                  tickLine={false}
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis stroke="#71717a" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const p = payload[0].payload;
                      return (
                        <div className="bg-zinc-950 border border-zinc-800 p-2 rounded-lg shadow-xl text-xs font-mono">
                          <div className="font-bold text-white mb-0.5">{p.name}</div>
                          <div className="text-cyan-400">
                            Value: <span className="font-bold">{p.value}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  dot={{ fill: "#0284c7", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Data Cards Row */}
        <div className="mt-3 pt-3 border-t border-zinc-900 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {formattedData.map((item, idx) => (
            <div
              key={idx}
              className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/60 flex flex-col justify-between"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[10px] text-zinc-400 font-mono truncate" title={item.name}>
                  {item.name}
                </span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="font-mono font-bold text-xs text-white">{item.value}</span>
                <span className="font-mono text-[10px] text-cyan-400">{item.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
