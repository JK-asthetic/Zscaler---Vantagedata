// Interactive Table Preview grid rendering schema and paginated preview records.
import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  RefreshCw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Database,
  Tag,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { getTablePreview } from "@/lib/api";
import { TablePreviewResponse } from "@/types";

interface TablePreviewProps {
  tableName: string;
  onAskAIAboutTable?: (question: string) => void;
  onBackToList?: () => void;
}

const ROWS_PER_PAGE = 10;

export const TablePreview: React.FC<TablePreviewProps> = ({
  tableName,
  onAskAIAboutTable,
  onBackToList,
}) => {
  const [data, setData] = useState<TablePreviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

  const fetchPreview = async (name: string): Promise<void> => {
    setIsLoading(true);
    setErrorMessage(null);
    setCurrentPage(1);

    try {
      const result = await getTablePreview(name, 50);
      setData(result);
    } catch (err: unknown) {
      const detail = err instanceof Error ? err.message : "Failed to load table preview.";
      setErrorMessage(detail);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (tableName) {
      fetchPreview(tableName);
    }
  }, [tableName]);

  const filteredRows = useMemo(() => {
    if (!data || !data.preview) return [];
    if (!searchQuery.trim()) return data.preview;
    const q = searchQuery.toLowerCase();
    return data.preview.filter((row) =>
      Object.values(row).some((val) => String(val ?? "").toLowerCase().includes(q))
    );
  }, [data, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ROWS_PER_PAGE));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredRows.slice(start, start + ROWS_PER_PAGE);
  }, [filteredRows, currentPage]);

  const handleAskAI = (): void => {
    if (onAskAIAboutTable) {
      onAskAIAboutTable(`Analyze the table '${tableName}', describe its key patterns, and highlight any anomalies or key metrics.`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-zinc-400">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-400 mb-2" />
        <span className="text-xs font-mono">Fetching table '{tableName}' schema and preview...</span>
      </div>
    );
  }

  if (errorMessage || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="p-4 max-w-md rounded-lg bg-red-950/40 border border-red-800 text-center space-y-3">
          <AlertCircle className="w-6 h-6 text-red-400 mx-auto" />
          <div className="text-xs font-semibold text-red-200">Failed to Load Preview</div>
          <p className="text-[11px] font-mono text-red-400">{errorMessage || "Table data unavailable"}</p>
          <div className="flex justify-center gap-2">
            {onBackToList && (
              <button
                type="button"
                onClick={onBackToList}
                className="px-3 py-1 rounded text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800"
              >
                Back to List
              </button>
            )}
            <button
              type="button"
              onClick={() => fetchPreview(tableName)}
              className="px-3 py-1 rounded text-xs bg-zinc-800 hover:bg-zinc-700 text-white flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-black overflow-hidden">
      {/* Table Metadata Header */}
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-950 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center text-cyan-400">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-white font-mono tracking-wide">{data.table_name}</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-300">
                {data.rows.toLocaleString()} total rows
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800">
                {data.columns.length} columns
              </span>
            </div>
            <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
              Live registry table • Token-efficient schema view
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onAskAIAboutTable && (
            <button
              type="button"
              onClick={handleAskAI}
              className="bg-blue-600 hover:bg-blue-500 text-white rounded-md px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask AI About This Table</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => fetchPreview(tableName)}
            className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800"
            title="Refresh Preview"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="px-4 py-2 border-b border-zinc-900 bg-zinc-950/70 flex items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={`Filter preview rows...`}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-md pl-8 pr-3 py-1 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600"
          />
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
          <span>
            Showing {filteredRows.length > 0 ? (currentPage - 1) * ROWS_PER_PAGE + 1 : 0}–
            {Math.min(currentPage * ROWS_PER_PAGE, filteredRows.length)} of {filteredRows.length} preview rows
          </span>
          <div className="flex items-center gap-1 ml-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed border border-zinc-800"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <span className="px-1.5 text-zinc-300">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed border border-zinc-800"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-zinc-900/90 text-zinc-400 text-[11px] font-mono sticky top-0 z-10 border-b border-zinc-800">
            <tr>
              <th className="py-2 px-3 font-semibold text-zinc-500 w-12 border-r border-zinc-800/60">#</th>
              {data.columns.map((col) => (
                <th key={col} className="py-2 px-3 font-semibold text-zinc-200 border-r border-zinc-800/60 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span>{col}</span>
                    {data.dtypes[col] && (
                      <span className="text-[9px] font-normal px-1 rounded bg-zinc-800 text-zinc-400">
                        {data.dtypes[col]}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900 text-xs font-mono">
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={data.columns.length + 1} className="py-8 text-center text-zinc-500 text-xs">
                  No records match your filter criteria.
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, idx) => {
                const rowNum = (currentPage - 1) * ROWS_PER_PAGE + idx + 1;
                return (
                  <tr key={idx} className="hover:bg-zinc-900/50 transition-colors">
                    <td className="py-2 px-3 text-zinc-600 border-r border-zinc-900 w-12">{rowNum}</td>
                    {data.columns.map((col) => {
                      const val = row[col];
                      const displayVal = val !== null && val !== undefined ? String(val) : "null";
                      const isNull = val === null || val === undefined;
                      return (
                        <td
                          key={col}
                          className={`py-2 px-3 border-r border-zinc-900 whitespace-nowrap truncate max-w-xs ${
                            isNull ? "text-zinc-600 italic" : "text-zinc-300"
                          }`}
                        >
                          {displayVal}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
