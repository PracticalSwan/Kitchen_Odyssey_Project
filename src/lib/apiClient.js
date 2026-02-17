// API client for Kitchen Odyssey backend.
// Adds timeout, retry, request deduplication, and lightweight interceptors.

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:3000/api/v1'
).replace(/\/$/, '');

const DEFAULT_TIMEOUT_MS = 10000;
const DEFAULT_RETRIES = 1;
const inFlight = new Map();

const requestInterceptors = [];
const responseInterceptors = [];

// Token refresh state
let refreshPromise = null;  // Single promise for concurrent refresh attempts

function getCsrfToken() {
  if (typeof document === 'undefined') return null;
  return document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('ko_csrf='))
    ?.split('=')
    .slice(1)
    .join('=') || null;
}

class SessionRefreshError extends Error {
  constructor(message, { status = 0, code = 'SESSION_REFRESH_FAILED', isTerminal = false } = {}) {
    super(message);
    this.name = 'SessionRefreshError';
    this.status = status;
    this.code = code;
    this.isTerminal = isTerminal;
  }
}

async function refreshAccessToken() {
  let response;
  try {
    response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    throw new SessionRefreshError('Unable to reach authentication server');
  }

  if (!response.ok) {
    const body = await parseResponseBody(response).catch(() => null);
    const status = response.status;
    const code = body?.error?.code || 'SESSION_REFRESH_FAILED';
    const message = body?.error?.message || 'Session refresh failed';
    const isTerminal = status === 401 || status === 403;

    // Only end the session for terminal auth failures.
    if (isTerminal) {
      try {
        const csrfToken = getCsrfToken();
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
          },
        });
      } catch { /* ignore logout error */ }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:session-expired'));
      }
    }

    throw new SessionRefreshError(message, { status, code, isTerminal });
  }

  return await parseResponseBody(response);
}

class ApiError extends Error {
  constructor(status, code, message, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function parseResponseBody(response) {
  if (response.status === 204) return null;

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  return text ? { success: true, data: text } : null;
}

function buildFetchConfig(options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const csrfToken = getCsrfToken();

  const config = {
    ...options,
    method,
    credentials: 'include',
    headers: {
      ...(options.body && !(options.body instanceof FormData)
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...(csrfToken && ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)
        ? { 'X-CSRF-Token': csrfToken }
        : {}),
      ...(options.headers || {}),
    },
  };

  if (
    config.body &&
    !(config.body instanceof FormData) &&
    typeof config.body === 'object'
  ) {
    config.body = JSON.stringify(config.body);
  }

  return config;
}

async function runRequestInterceptors(config) {
  let next = config;
  for (const interceptor of requestInterceptors) {
    next = (await interceptor(next)) || next;
  }
  return next;
}

async function runResponseInterceptors(payload) {
  let next = payload;
  for (const interceptor of responseInterceptors) {
    next = (await interceptor(next)) || next;
  }
  return next;
}

function shouldRetry(error, attempt, retries) {
  if (attempt >= retries) return false;
  if (error?.name === 'AbortError') return true;
  if (error instanceof ApiError && error.status >= 500) return true;
  if (!(error instanceof ApiError)) return true;
  return false;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url, fetchConfig, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...fetchConfig, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function normalizeSuccessBody(body) {
  if (body === null || body === undefined) return null;
  if (typeof body !== 'object') return body;
  if (Object.prototype.hasOwnProperty.call(body, 'success')) {
    return body.data;
  }
  return body;
}

async function executeRequest(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = options.retries ?? DEFAULT_RETRIES;
  const isAuthEndpoint = path.startsWith('/auth/login')
    || path.startsWith('/auth/signup')
    || path.startsWith('/auth/refresh')
    || path.startsWith('/auth/logout');

  let attempt = 0;
  while (true) {
    try {
      const config = await runRequestInterceptors(buildFetchConfig(options));
      const response = await fetchWithTimeout(url, config, timeoutMs);
      const body = await parseResponseBody(response);

      if (!response.ok || (body && body.success === false)) {
        // Handle 401 Unauthorized - try to refresh token
        if (response.status === 401 && !options._isRetry && !isAuthEndpoint) {
          // Use shared promise for concurrent refresh attempts
          if (!refreshPromise) {
            refreshPromise = refreshAccessToken().finally(() => {
              refreshPromise = null;  // Clear after completion
            });
          }

          try {
            await refreshPromise;
            // Retry the original request with new token
            return executeRequest(path, { ...options, _isRetry: true });
          } catch (refreshError) {
            if (refreshError instanceof SessionRefreshError && !refreshError.isTerminal) {
              throw new ApiError(
                refreshError.status || 503,
                refreshError.code || 'SESSION_REFRESH_FAILED',
                refreshError.message || 'Session refresh failed. Please try again.',
              );
            }
            // Terminal auth refresh failure.
            throw new ApiError(401, 'UNAUTHORIZED', 'Session expired. Please login again.');
          }
        }

        throw new ApiError(
          response.status,
          body?.error?.code || 'UNKNOWN_ERROR',
          body?.error?.message || `Request failed (${response.status})`,
          body?.error?.details ?? null,
        );
      }

      const payload = normalizeSuccessBody(body);
      return runResponseInterceptors(payload);
    } catch (error) {
      if (!shouldRetry(error, attempt, retries)) {
        throw error;
      }
      attempt += 1;
      // Exponential backoff: 150ms, 300ms, ...
      await wait(150 * Math.pow(2, attempt - 1));
    }
  }
}

function getDedupeKey(path, options) {
  const method = (options?.method || 'GET').toUpperCase();
  if (method !== 'GET') return null;
  if (options?.dedupe === false) return null;
  return options?.dedupeKey || `${method}:${path}`;
}

async function request(path, options = {}) {
  const dedupeKey = getDedupeKey(path, options);
  if (dedupeKey && inFlight.has(dedupeKey)) {
    return inFlight.get(dedupeKey);
  }

  const operation = executeRequest(path, options)
    .finally(() => {
      if (dedupeKey) inFlight.delete(dedupeKey);
    });

  if (dedupeKey) {
    inFlight.set(dedupeKey, operation);
  }

  return operation;
}

export const api = {
  get: (path, options = {}) => request(path, { method: 'GET', ...options }),
  post: (path, body, options = {}) => request(path, { method: 'POST', body, ...options }),
  patch: (path, body, options = {}) => request(path, { method: 'PATCH', body, ...options }),
  delete: (path, options = {}) => request(path, { method: 'DELETE', ...options }),
  upload: (path, formData, options = {}) => request(path, { method: 'POST', body: formData, ...options }),
  addRequestInterceptor: (handler) => {
    requestInterceptors.push(handler);
    return () => {
      const idx = requestInterceptors.indexOf(handler);
      if (idx >= 0) requestInterceptors.splice(idx, 1);
    };
  },
  addResponseInterceptor: (handler) => {
    responseInterceptors.push(handler);
    return () => {
      const idx = responseInterceptors.indexOf(handler);
      if (idx >= 0) responseInterceptors.splice(idx, 1);
    };
  },
};

export { ApiError };
