const API_PREFIX = "/api/v1";

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
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...rest,
    headers,
  });

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
    const message =
      (isJson && data && (data.detail || data.message)) ||
      response.statusText ||
      "Request failed";
    throw new ApiError(response.status, message, data);
  }

  return data as T;
}
