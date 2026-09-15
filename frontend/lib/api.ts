// Assumption: Backend API URL is configured via NEXT_PUBLIC_API_URL with http://localhost:8000 fallback.
import {
  ChatMessage,
  ChatResponse,
  ChatRequestPayload,
  TablesListResponse,
  TablePreviewResponse,
  TableUploadResponse,
} from "@/types";

const BACKEND_BASE_URL: string = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function sendChatMessage(
  message: string,
  conversationHistory: ChatMessage[],
  focusedTable?: string | null,
): Promise<ChatResponse> {
  const payload: ChatRequestPayload = {
    message: message.trim(),
    conversation_history: conversationHistory,
    focused_table: focusedTable ?? null,
  };

  const endpoint = `${BACKEND_BASE_URL}/api/chat`;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (networkError: unknown) {
    const detail = networkError instanceof Error ? networkError.message : "Network error";
    throw new Error(`Failed to reach backend server at ${endpoint}: ${detail}`);
  }

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status} ${response.statusText}`;
    try {
      const errorJson = (await response.json()) as { detail?: string };
      if (errorJson?.detail) {
        errorDetail = errorJson.detail;
      }
    } catch {
      // Body was not JSON; use default status text
    }
    throw new Error(`Server returned error: ${errorDetail}`);
  }

  const data = (await response.json()) as ChatResponse;
  return data;
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/health`, {
      method: "GET",
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function listTables(): Promise<TablesListResponse> {
  const endpoint = `${BACKEND_BASE_URL}/api/tables`;
  const res = await fetch(endpoint, { method: "GET", cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to list tables: HTTP ${res.status}`);
  }
  return (await res.json()) as TablesListResponse;
}

export async function getTablePreview(tableName: string, limit: number = 50): Promise<TablePreviewResponse> {
  const endpoint = `${BACKEND_BASE_URL}/api/tables/${encodeURIComponent(tableName)}/preview?limit=${limit}`;
  const res = await fetch(endpoint, { method: "GET", cache: "no-store" });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const err = (await res.json()) as { detail?: string };
      if (err?.detail) detail = err.detail;
    } catch {
      // ignore
    }
    throw new Error(`Failed to preview table '${tableName}': ${detail}`);
  }
  return (await res.json()) as TablePreviewResponse;
}

export async function uploadTableFile(file: File): Promise<TableUploadResponse> {
  const endpoint = `${BACKEND_BASE_URL}/api/upload`;
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(endpoint, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const err = (await res.json()) as { detail?: string };
      if (err?.detail) detail = err.detail;
    } catch {
      // ignore
    }
    throw new Error(`Upload failed: ${detail}`);
  }

  return (await res.json()) as TableUploadResponse;
}

