import { ApiError, parseApiError } from './error';

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown | FormData;
  branchId?: string;
  timeoutMs?: number;
}

let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'x-beautyflow-request': 'browser' },
    })
      .then((response) => response.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
  retryAfterRefresh = true,
): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), options.timeoutMs ?? 15_000);
  const headers = new Headers(options.headers);
  if (options.body !== undefined && !(options.body instanceof FormData)) {
    headers.set('content-type', 'application/json');
  }
  if (options.branchId) headers.set('x-branch-id', options.branchId);
  if (options.method && options.method !== 'GET' && options.method !== 'HEAD') {
    headers.set('x-beautyflow-request', 'browser');
  }

  try {
    const response = await fetch(path, {
      ...options,
      body:
        options.body === undefined
          ? undefined
          : options.body instanceof FormData
            ? options.body
            : JSON.stringify(options.body),
      credentials: 'same-origin',
      headers,
      signal: options.signal ?? controller.signal,
    });
    if (response.status === 401 && retryAfterRefresh && path !== '/api/auth/refresh') {
      if (await refreshSession()) return apiRequest<T>(path, options, false);
    }
    if (!response.ok) throw await parseApiError(response);
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(0, 'REQUEST_TIMEOUT', 'The request timed out');
    }
    throw new ApiError(0, 'NETWORK_ERROR', 'The service is unavailable');
  } finally {
    window.clearTimeout(timeout);
  }
}

export function resetRefreshCoordinator() {
  refreshPromise = null;
}
