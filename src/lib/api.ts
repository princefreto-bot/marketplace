export type ApiMethod = "GET" | "POST" | "PUT" | "DELETE";

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function getToken() {
  try {
    return localStorage.getItem("localdeals_token");
  } catch {
    return null;
  }
}

export async function apiFetch<T>(
  path: string,
  opts?: {
    method?: ApiMethod;
    body?: unknown;
    auth?: boolean;
    headers?: Record<string, string>;
  }
): Promise<T> {
  const method = opts?.method || "GET";
  const auth = opts?.auth ?? false;

  const headers: Record<string, string> = {
    ...(opts?.headers || {}),
  };

  const token = auth ? getToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let body: BodyInit | undefined;
  const rawBody = opts?.body;

  // For FormData, pass through.
  if (rawBody instanceof FormData) {
    body = rawBody;
  } else if (rawBody !== undefined) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
    body = JSON.stringify(rawBody);
  }

  const res = await fetch(path, { method, headers, body });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => "");

  if (!res.ok) {
    const msg =
      (isJson && data && typeof data === "object" && "message" in (data as any) && String((data as any).message)) ||
      `HTTP ${res.status}`;
    throw new ApiError(msg, res.status, data);
  }

  return data as T;
}

export const apiGet = <T,>(path: string, auth = false) => apiFetch<T>(path, { method: "GET", auth });
export const apiPost = <T,>(path: string, body?: unknown, auth = false) => apiFetch<T>(path, { method: "POST", body, auth });
export const apiPut = <T,>(path: string, body?: unknown, auth = false) => apiFetch<T>(path, { method: "PUT", body, auth });
export const apiDelete = <T,>(path: string, auth = false) => apiFetch<T>(path, { method: "DELETE", auth });
