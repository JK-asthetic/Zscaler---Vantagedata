// TableBrowser listing all active registry tables with schema summary and preview navigation.
import React, { useState, useEffect } from "react";
import {
  Database,
  UploadCloud,
  RefreshCw,
  Search,
  Table as TableIcon,
  ChevronRight,
  Sparkles,
  Layers,
  Loader2,
  FileCheck,
} from "lucide-react";
import { listTables } from "@/lib/api";
import { TablesListResponse, TableSummaryItem } from "@/types";

interface TableBrowserProps {
  selectedTable: string | null;
  onSelectTable: (tableName: string) => void;
  onOpenUploadModal: () => void;
  onAskAIAboutTable?: (question: string) => void;
  refreshTrigger?: number;
}

const DEFAULT_CORE_TABLES = new Set([
  "customers",
  "subscriptions",
  "usage",
  "support_tickets",
  "revenue_events",
]);

export const TableBrowser: React.FC<TableBrowserProps> = ({
  selectedTable,
  onSelectTable,
  onOpenUploadModal,
  onAskAIAboutTable,
  refreshTrigger,
}) => {
  const [tablesData, setTablesData] = useState<TablesListResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const fetchTables = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listTables();
      setTablesData(data);
      if (!selectedTable && data.tables.length > 0) {
        onSelectTable(data.tables[0]);
      }
    } catch (err: unknown) {
      const detail = err instanceof Error ? err.message : "Failed to load tables list";
      setError(detail);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, [refreshTrigger]);

  const summaries = tablesData?.summary ?? [];
  const filteredSummaries = summaries.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.columns.some((col) => col.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-r border-zinc-800/80 w-80 flex-shrink-0">
      {/* Header */}
      <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
            <Database className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Table Registry</span>
              <span className="text-[10px] font-mono text-zinc-400 px-1.5 py-0.2 rounded bg-zinc-800">
                {tablesData?.tables.length ?? 0}
              </span>
            </div>
            <div className="text-[10px] text-zinc-500 font-mono">In-memory dynamic storage</div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={fetchTables}
            className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded cursor-pointer"
            title="Refresh Table List"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={onOpenUploadModal}
            className="p-1 text-blue-400 hover:text-blue-300 hover:bg-blue-950/40 border border-blue-900 rounded cursor-pointer"
            title="Upload New Table"
          >
            <UploadCloud className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Upload Action Bar */}
      <div className="p-2.5 border-b border-zinc-900 bg-zinc-950">
        <button
          type="button"
          onClick={onOpenUploadModal}
          className="w-full py-1.5 px-2.5 rounded-lg bg-gradient-to-r from-blue-600/20 to-cyan-600/20 hover:from-blue-600/30 hover:to-cyan-600/30 border border-blue-500/30 hover:border-blue-500/50 text-blue-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
        >
          <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
          <span>Upload Dataset (CSV/XLSX)</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="p-2.5 border-b border-zinc-900">
        <div className="relative">
          <Search className="w-3 h-3 absolute left-2.5 top-2.5 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tables or columns..."
            className="w-full bg-zinc-900/80 border border-zinc-800 rounded-md pl-7 pr-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600"
          />
        </div>
      </div>

      {/* Table Cards List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {isLoading && !tablesData && (
          <div className="py-8 flex flex-col items-center justify-center text-zinc-500 text-xs font-mono">
            <Loader2 className="w-4 h-4 animate-spin mb-2 text-cyan-400" />
            <span>Loading table registry...</span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-red-950/40 border border-red-800 text-red-300 text-xs">
            <div className="font-semibold mb-1">Failed to list tables</div>
            <div className="text-[10px] font-mono text-red-400">{error}</div>
            <button
              type="button"
              onClick={fetchTables}
              className="mt-2 text-[11px] underline text-zinc-300"
            >
              Retry
            </button>
          </div>
        )}

        {filteredSummaries.map((table) => {
          const isSelected = selectedTable === table.name;
          const isCoreTable = DEFAULT_CORE_TABLES.has(table.name);

          return (
            <div
              key={table.name}
              onClick={() => onSelectTable(table.name)}
              className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                isSelected
                  ? "bg-zinc-900 border-cyan-500/60 shadow-sm"
                  : "bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900/80 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <TableIcon
                    className={`w-3.5 h-3.5 flex-shrink-0 ${
                      isSelected ? "text-cyan-400" : "text-zinc-500"
                    }`}
                  />
                  <span className="text-xs font-bold text-white font-mono truncate">
                    {table.name}
                  </span>
                </div>
                {isCoreTable ? (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                    core
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                    uploaded
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-1.5">
                <span>{table.rows.toLocaleString()} rows</span>
                <span>{table.columns.length} columns</span>
              </div>

              {/* Columns Preview Pill List */}
              <div className="flex flex-wrap gap-1 overflow-hidden max-h-8">
                {table.columns.slice(0, 3).map((col) => (
                  <span
                    key={col}
                    className="px-1 py-0.2 rounded text-[9px] font-mono bg-zinc-950 text-zinc-400 border border-zinc-800 truncate max-w-[90px]"
                  >
                    {col}
                  </span>
                ))}
                {table.columns.length > 3 && (
                  <span className="text-[9px] font-mono text-zinc-500 self-center">
                    +{table.columns.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
