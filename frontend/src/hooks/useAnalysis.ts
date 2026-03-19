import type { AnalysisData } from "../constants/sampleData";

const API_KEY = import.meta.env.VITE_API_KEY;
// When set, call backend directly (e.g. http://localhost:8000). Use when proxy returns 404.
const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

function apiFetch(url: string, options: RequestInit = {}) {
  const fullUrl = API_BASE ? `${API_BASE}${url.replace(/^\/api/, "")}` : url;
  const headers = new Headers(options.headers);
  if (API_KEY) headers.set("X-API-Key", API_KEY);
  return fetch(fullUrl, { ...options, headers });
}

function parseError(data: unknown, status?: number): string {
  if (typeof data === "object" && data !== null && "detail" in data) {
    const d = (data as { detail: unknown }).detail;
    if (typeof d === "string") return d;
    if (Array.isArray(d) && d[0]?.msg) return d[0].msg;
  }
  if (status === 404) {
    return "API endpoint not found (404). Run the frontend with 'npm run dev' so the proxy works, or set VITE_API_URL=http://localhost:8000 in frontend/.env to call the backend directly.";
  }
  if (status === 502 || status === 503) {
    return "Backend is not responding. Make sure Docker is running (docker compose up) and the API is available at http://localhost:8000.";
  }
  if (status === 401) {
    return "Invalid or missing API key. Check your VITE_API_KEY if API_KEY is set in the backend.";
  }
  return status
    ? `An unexpected error occurred (status ${status}). Check the browser console for details.`
    : "An unexpected error occurred.";
}

/**
 * Fetches full analysis for a statement from GET /analysis/{statement_id}.
 * The summary field will be populated automatically when the backend returns it
 * in the response. If the backend does not yet return summary, the AI Analysis
 * section will not render in real results but will render correctly in the demo.
 */
export async function fetchAnalysis(statementId: string | number): Promise<AnalysisData> {
  const url = `/api/analysis/${statementId}`;

  const doFetch = async (): Promise<AnalysisData> => {
    const r = await apiFetch(url);
    const data = await r.json().catch(() => ({}));

    if (r.ok) {
      return data as AnalysisData;
    }

    if (r.status === 404) {
      throw new Error("RETRY");
    }

    if (r.status === 400) {
      throw new Error(parseError(data, r.status));
    }

    if (r.status >= 500) {
      throw new Error(parseError(data, r.status));
    }

    throw new Error(parseError(data, r.status));
  };

  let lastError: Error | null = null;
  const maxRetries = 3;
  const retryDelayMs = 500;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await doFetch();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (lastError.message !== "RETRY" || attempt === maxRetries - 1) {
        if (lastError.message === "RETRY") {
          throw new Error("Statement not found. Please try again.");
        }
        throw lastError;
      }
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }
  }

  throw lastError ?? new Error("Something went wrong. Please try again.");
}

export async function ingestStatement(
  file: File,
  bankType: string
): Promise<{ statement_id: number }> {
  const form = new FormData();
  form.append("file", file);
  form.append("bank_type", bankType);

  let r: Response;
  try {
    r = await apiFetch("/api/ingest", { method: "POST", body: form });
  } catch {
    throw new Error("Could not reach the server. Check your connection.");
  }

  const data = await r.json().catch(() => ({}));

  if (!r.ok) {
    throw new Error(parseError(data, r.status));
  }

  return { statement_id: data.statement_id };
}
