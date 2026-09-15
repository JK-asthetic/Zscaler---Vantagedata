// Dynamic drag-and-drop file uploader supporting CSV, Excel, and JSON datasets.
import React, { useState, useRef, DragEvent, ChangeEvent } from "react";
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, X } from "lucide-react";
import { uploadTableFile } from "@/lib/api";
import { TableUploadResponse } from "@/types";

interface FileUploadProps {
  onUploadSuccess: (result: TableUploadResponse) => void;
  onCancel?: () => void;
}

const MAX_FILE_SIZE_MB = 10;
const ACCEPTED_EXTENSIONS = [".csv", ".xlsx", ".xls", ".json"];

export const FileUpload: React.FC<FileUploadProps> = ({ onUploadSuccess, onCancel }) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<TableUploadResponse | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const validateFile = (file: File): string | null => {
    const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      return `Unsupported file format. Please provide ${ACCEPTED_EXTENSIONS.join(", ")}`;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return `File exceeds maximum allowed size of ${MAX_FILE_SIZE_MB}MB`;
    }
    return null;
  };

  const handleFileSelection = (file: File): void => {
    setErrorMessage(null);
    setSuccessResult(null);
    const error = validateFile(file);
    if (error) {
      setErrorMessage(error);
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (): Promise<void> => {
    if (!selectedFile || isUploading) return;

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const response = await uploadTableFile(selectedFile);
      setSuccessResult(response);
      onUploadSuccess(response);
    } catch (err: unknown) {
      const detail = err instanceof Error ? err.message : "Failed to upload file.";
      setErrorMessage(detail);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-2xl w-full max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400">
            <UploadCloud className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Upload Dataset</h3>
            <p className="text-[11px] text-zinc-500 font-mono">
              In-memory registration • CSV, Excel (.xlsx, .xls), JSON
            </p>
          </div>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-zinc-500 hover:text-white p-1 rounded hover:bg-zinc-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Drag & Drop Surface */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
          isDragging
            ? "border-blue-500 bg-blue-950/20"
            : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/40"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls,.json"
          onChange={handleInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-400">
            <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-200 font-medium">
              Click to select or drag & drop dataset
            </p>
            <p className="text-[10px] text-zinc-500 font-mono mt-1">
              Supports .csv, .xlsx, .xls, .json up to {MAX_FILE_SIZE_MB}MB (max 50,000 rows)
            </p>
          </div>
        </div>
      </div>

      {/* Selected File Details */}
      {selectedFile && (
        <div className="mt-4 p-3 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <div className="truncate">
              <div className="text-xs font-semibold text-white truncate">{selectedFile.name}</div>
              <div className="text-[10px] font-mono text-zinc-400">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedFile(null);
              setSuccessResult(null);
            }}
            className="text-zinc-500 hover:text-zinc-300 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="mt-3 p-3 rounded-lg bg-red-950/40 border border-red-800/80 text-red-300 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="text-[11px] font-mono leading-relaxed">{errorMessage}</div>
        </div>
      )}

      {/* Success Notification */}
      {successResult && (
        <div className="mt-3 p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/80 text-emerald-300 text-xs flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-emerald-200">{successResult.message}</div>
            <div className="text-[10px] font-mono text-emerald-400">
              Table: <span className="text-white font-bold">{successResult.table_name}</span> • Rows: {successResult.rows} • Columns: {successResult.columns.length}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-5 flex items-center justify-end gap-2.5">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded-md text-xs font-medium text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleUploadSubmit}
          disabled={!selectedFile || isUploading}
          className="px-4 py-1.5 rounded-md text-xs font-semibold bg-white hover:bg-zinc-200 text-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors shadow-sm"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Registering Table...</span>
            </>
          ) : (
            <>
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload & Register</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
