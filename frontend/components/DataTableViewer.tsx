// Executive Data Table Explorer with dynamic dataset switcher, schema preview, and token-efficient pagination.
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Database,
  ChevronDown,
  Search,
  UploadCloud,
  Sparkles,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Check,
  CheckCircle2,
  X,
  FileSpreadsheet,
  Layers,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { listTables, getTablePreview } from "@/lib/api";
import { FileUpload } from "@/components/FileUpload";
import { TablesListResponse, TablePreviewResponse, TableUploadResponse } from "@/types";

interface DataTableViewerProps {
  selectedTable: string;
  onSelectTable: (tableName: string) => void;
  onAskAIAboutTable: (question: string) => void;
  isExternalUploadOpen?: boolean;
  onToggleUploadModal?: (open: boolean) => void;
  refreshTrigger?: number;
}

const ROWS_PER_PAGE = 15;
const DEFAULT_CORE_TABLES = new Set([
  "customers",
  "subscriptions",
  "usage",
  "support_tickets",
  "revenue_events",
]);

export const DataTableViewer: React.FC<DataTableViewerProps> = ({
  selectedTable,
  onSelectTable,
  onAskAIAboutTable,
  isExternalUploadOpen,
  onToggleUploadModal,
  refreshTrigger = 0,
}) => {
  // Registry & Preview State
  const [tablesList, setTablesList] = useState<TablesListResponse | null>(null);
  const [previewData, setPreviewData] = useState<TablePreviewResponse | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(true);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // UI State
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [dropdownSearch, setDropdownSearch] = useState<string>("");
  const [rowSearchQuery, setRowSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [internalUploadModalOpen, setInternalUploadModalOpen] = useState<boolean>(false);
  const [uploadSuccessNotice, setUploadSuccessNotice] = useState<string | null>(null);
  const [localRefresh, setLocalRefresh] = useState<number>(0);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const isUploadModalOpen = isExternalUploadOpen !== undefined ? isExternalUploadOpen : internalUploadModalOpen;

  const setModalOpen = (open: boolean): void => {
    setInternalUploadModalOpen(open);
    onToggleUploadModal?.(open);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch available tables from registry
  const loadAvailableTables = async (): Promise<void> => {
    try {
      const data = await listTables();
      setTablesList(data);
      if (data.tables.length > 0 && !data.tables.includes(selectedTable)) {
        onSelectTable(data.tables[0]);
      }
    } catch {
      // keep fallback
    }
  };

  useEffect(() => {
    loadAvailableTables();
  }, [refreshTrigger, localRefresh]);

  // Fetch preview for selected table
  const fetchTablePreview = async (name: string): Promise<void> => {
    if (!name) return;
    setIsLoadingPreview(true);
    setPreviewError(null);
    setCurrentPage(1);

    try {
      const result = await getTablePreview(name, 100);
      setPreviewData(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load table data.";
      setPreviewError(msg);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  useEffect(() => {
    fetchTablePreview(selectedTable);
  }, [selectedTable, refreshTrigger, localRefresh]);

  // Handle successful upload
  const handleUploadSuccess = (result: TableUploadResponse): void => {
    setModalOpen(false);
    onSelectTable(result.table_name);
    setUploadSuccessNotice(
      `Dataset '${result.table_name}' registered successfully (${result.rows.toLocaleString()} rows). Chatbot context is now set to this table.`
    );
    setLocalRefresh((prev) => prev + 1);
  };

  // Filter preview rows client-side
  const filteredRows = useMemo(() => {
    if (!previewData || !previewData.preview) return [];
    if (!rowSearchQuery.trim()) return previewData.preview;
    const q = rowSearchQuery.toLowerCase();
    return previewData.preview.filter((row) =>
      Object.values(row).some((val) => String(val ?? "").toLowerCase().includes(q))
    );
  }, [previewData, rowSearchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ROWS_PER_PAGE));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredRows.slice(start, start + ROWS_PER_PAGE);
  }, [filteredRows, currentPage]);

  // Filter tables in dropdown
  const filteredTablesInDropdown = useMemo(() => {
    const all = tablesList?.summary ?? [];
    if (!dropdownSearch.trim()) return all;
    const q = dropdownSearch.toLowerCase();
    return all.filter(
      (t) => t.name.toLowerCase().includes(q) || t.columns.some((c) => c.toLowerCase().includes(q))
    );
  }, [tablesList, dropdownSearch]);

  const handleAskAIAboutActiveTable = (): void => {
    onAskAIAboutTable(
      `Analyze the active table '${selectedTable}', summarize key patterns, row distributions, and flag any potential anomalies.`
    );
  };

  return (
    <div className="flex flex-col h-full bg-black min-w-0 overflow-hidden select-none">
      {/* Top Unified Data Toolbar */}
      <div className="px-4 py-2.5 border-b border-zinc-800 bg-zinc-950 flex flex-wrap items-center justify-between gap-3 flex-shrink-0 z-10">
        {/* Left: Dataset Selector Dropdown & Stats */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Dataset Switcher Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-700/80 hover:border-zinc-500 text-white transition-all cursor-pointer shadow-sm group"
              title="Click to switch active dataset"
            >
              <Database className="w-4 h-4 text-cyan-400 flex-shrink-0 group-hover:scale-105 transition-transform" />
              <div className="flex items-center gap-1.5 text-left min-w-0">
                <span className="font-mono text-xs font-bold truncate max-w-[220px] sm:max-w-[320px] text-zinc-100">
                  {selectedTable}
                </span>
                {previewData && (
                  <span className="text-[10px] font-mono text-zinc-400 font-normal hidden sm:inline">
                    ({previewData.rows.toLocaleString()} rows)
                  </span>
                )}
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${
                  isDropdownOpen ? "rotate-180 text-cyan-400" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-80 max-h-96 rounded-xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden z-50 flex flex-col animate-in fade-in zoom-in-95 duration-100">
                <div className="p-2.5 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                    Switch Dataset ({tablesList?.tables.length ?? 0})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setModalOpen(true);
                    }}
                    className="text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                  >
                    <UploadCloud className="w-3 h-3" />
                    <span>Upload New</span>
                  </button>
                </div>

                {/* Search input in dropdown */}
                <div className="p-2 border-b border-zinc-900">
                  <div className="relative">
                    <Search className="w-3 h-3 absolute left-2.5 top-2.5 text-zinc-500" />
                    <input
                      type="text"
                      value={dropdownSearch}
                      onChange={(e) => setDropdownSearch(e.target.value)}
                      placeholder="Search tables..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-md pl-7 pr-2 py-1 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600"
                    />
                  </div>
                </div>

                {/* Table list */}
                <div className="overflow-y-auto max-h-60 p-1.5 space-y-1">
                  {filteredTablesInDropdown.map((tbl) => {
                    const isSelected = selectedTable === tbl.name;
                    const isCore = DEFAULT_CORE_TABLES.has(tbl.name);

                    return (
                      <button
                        key={tbl.name}
                        type="button"
                        onClick={() => {
                          onSelectTable(tbl.name);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-zinc-800 border border-cyan-500/50 text-white"
                            : "hover:bg-zinc-900 text-zinc-300 border border-transparent"
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-semibold truncate">
                              {tbl.name}
                            </span>
                            {isCore ? (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-zinc-900 text-zinc-400 border border-zinc-800">
                                core
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                                uploaded
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                            {tbl.rows.toLocaleString()} rows • {tbl.columns.length} cols
                          </div>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats Badges */}
          {previewData && (
            <div className="hidden sm:flex items-center gap-2 font-mono text-xs">
              <span className="px-2 py-0.5 rounded-full text-[11px] bg-zinc-900 border border-zinc-800 text-zinc-300">
                {previewData.rows.toLocaleString()} rows
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] bg-cyan-950 text-cyan-400 border border-cyan-800/80">
                {previewData.columns.length} columns
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-950/70 text-emerald-300 border border-emerald-800/70 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active Context
              </span>
            </div>
          )}
        </div>

        {/* Right: Search Filter, Pagination, and Action Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Row Search Filter */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-zinc-500" />
            <input
              type="text"
              value={rowSearchQuery}
              onChange={(e) => {
                setRowSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search records..."
              className="w-36 sm:w-48 bg-zinc-900 border border-zinc-800 rounded-md pl-8 pr-2.5 py-1 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 transition-all"
            />
          </div>

          {/* Pagination Controls */}
          {filteredRows.length > 0 && (
            <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-800">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Previous page"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <span className="px-1 text-zinc-300">
                {currentPage}/{totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Next page"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Upload Button */}
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-md bg-zinc-900 hover:bg-zinc-850 border border-zinc-700 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            title="Upload dataset (.csv, .xlsx, .json)"
          >
            <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Upload</span>
          </button>

          {/* Ask AI About Active Table Button */}
          <button
            type="button"
            onClick={handleAskAIAboutActiveTable}
            className="bg-blue-600 hover:bg-blue-500 text-white rounded-md px-3 py-1 text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
            title={`Ask Claude to analyze ${selectedTable}`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Analyze in Chat</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {uploadSuccessNotice && (
        <div className="px-4 py-2 bg-emerald-950/60 border-b border-emerald-800/80 text-emerald-300 text-xs flex items-center justify-between flex-shrink-0 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="font-mono text-[11px]">{uploadSuccessNotice}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                handleAskAIAboutActiveTable();
                setUploadSuccessNotice(null);
              }}
              className="text-[11px] font-semibold underline text-white hover:text-emerald-200 cursor-pointer"
            >
              Ask Claude Now →
            </button>
            <button
              type="button"
              onClick={() => setUploadSuccessNotice(null)}
              className="text-emerald-400 hover:text-white p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Full-Width Table View */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        {isLoadingPreview ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-zinc-400">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-400 mb-2" />
            <span className="text-xs font-mono">Loading records for '{selectedTable}'...</span>
          </div>
        ) : previewError || !previewData ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="p-4 max-w-md rounded-lg bg-red-950/40 border border-red-800 text-center space-y-3">
              <AlertCircle className="w-6 h-6 text-red-400 mx-auto" />
              <div className="text-xs font-semibold text-red-200">Failed to Load Dataset</div>
              <p className="text-[11px] font-mono text-red-400">{previewError || "Table unavailable"}</p>
              <button
                type="button"
                onClick={() => fetchTablePreview(selectedTable)}
                className="px-3 py-1 rounded text-xs bg-zinc-800 hover:bg-zinc-700 text-white inline-flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Retry
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-zinc-900/90 text-zinc-400 text-[11px] font-mono sticky top-0 z-10 border-b border-zinc-800 backdrop-blur-sm">
                <tr>
                  <th className="py-2.5 px-3 font-semibold text-zinc-500 w-12 border-r border-zinc-800/60 text-center">
                    #
                  </th>
                  {previewData.columns.map((col) => (
                    <th
                      key={col}
                      className="py-2.5 px-3 font-semibold text-zinc-200 border-r border-zinc-800/60 whitespace-nowrap max-w-xs truncate"
                      title={col}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="truncate">{col}</span>
                        {previewData.dtypes[col] && (
                          <span className="text-[9px] font-normal px-1 rounded bg-zinc-800 text-zinc-400 flex-shrink-0">
                            {previewData.dtypes[col]}
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
                    <td
                      colSpan={previewData.columns.length + 1}
                      className="py-12 text-center text-zinc-500 text-xs font-mono"
                    >
                      {rowSearchQuery ? "No records match your search filter." : "This table has no rows."}
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row, idx) => {
                    const rowNum = (currentPage - 1) * ROWS_PER_PAGE + idx + 1;
                    return (
                      <tr key={idx} className="hover:bg-zinc-900/40 transition-colors">
                        <td className="py-2 px-3 text-zinc-600 border-r border-zinc-900 text-center w-12 text-[11px]">
                          {rowNum}
                        </td>
                        {previewData.columns.map((col) => {
                          const val = row[col];
                          const isNull = val === null || val === undefined || String(val).trim() === "";
                          const displayVal = isNull ? "—" : String(val);

                          return (
                            <td
                              key={col}
                              className={`py-2 px-3 border-r border-zinc-900 whitespace-nowrap truncate max-w-xs ${
                                isNull ? "text-zinc-600 italic" : "text-zinc-300"
                              }`}
                              title={isNull ? "null / empty" : String(val)}
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
        )}
      </div>

      {/* File Upload Modal Overlay */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg">
            <FileUpload
              onUploadSuccess={handleUploadSuccess}
              onCancel={() => setModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
