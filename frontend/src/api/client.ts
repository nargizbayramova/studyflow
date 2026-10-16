const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/+$/, "");
const API_PREFIX = API_BASE.endsWith("/api/v1") ? API_BASE : `${API_BASE}/api/v1`;

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export function extractErrorMessage(data: unknown, fallback: string = "Request failed"): string {
  if (!data) return fallback;
  if (typeof data === "string") return data;

  if (typeof data === "object") {
    const record = data as Record<string, unknown>;

    // FastAPI 422: detail is an array of error objects: [{ loc: ["body", "field"], msg: "..." }]
    if (Array.isArray(record.detail)) {
      const messages = record.detail
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object") {
            const err = item as { loc?: (string | number)[]; msg?: string };
            const rawField =
              err.loc && err.loc.length > 0 ? String(err.loc[err.loc.length - 1]) : "";
            if (rawField && rawField !== "body") {
              const fieldName = rawField.replace(/_/g, " ");
              const capitalized = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
              return `${capitalized}: ${err.msg || "Invalid value"}`;
            }
            return err.msg || "Invalid value";
          }
          return String(item);
        })
        .filter(Boolean);

      if (messages.length > 0) {
        return messages.join("; ");
      }
    }

    if (typeof record.detail === "string" && record.detail.trim()) {
      return record.detail;
    }
    if (typeof record.message === "string" && record.message.trim()) {
      return record.message;
    }
    if (typeof record.error === "string" && record.error.trim()) {
      return record.error;
    }
  }

  return fallback;
}

export function getAuthToken(): string | null {
  return localStorage.getItem("studyflow_token");
}

export function setAuthToken(token: string): void {
  localStorage.setItem("studyflow_token", token);
}

export function removeAuthToken(): void {
  localStorage.removeItem("studyflow_token");
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers: customHeaders, ...rest } = options;

  let url = `${API_PREFIX}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const token = getAuthToken();
  const headers = new Headers(customHeaders);
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers,
    });
  } catch (err: unknown) {
    const msg =
      err instanceof Error
        ? `Cannot connect to server at ${API_BASE}. Is the backend running?`
        : "Network connection error";
    throw new ApiError(0, msg);
  }

  if (response.status === 401) {
    removeAuthToken();
    window.dispatchEvent(new Event("auth:unauthorized"));
  }

  if (response.status === 204) {
    return {} as T;
  }

  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message = extractErrorMessage(data, response.statusText || "Request failed");
    throw new ApiError(response.status, message, data);
  }

  return data as T;
}
