import 'server-only';

import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';
import { cookies, headers } from 'next/headers';

const ACCESS_COOKIE = 'bf_access';
const REFRESH_COOKIE = 'bf_refresh';

function resolveBackendUrl() {
  const value = process.env.BACKEND_API_URL ?? 'http://localhost:3000/api/v1';
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('BACKEND_API_URL must be a valid absolute HTTP(S) URL');
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('BACKEND_API_URL must use HTTP or HTTPS');
  }
  return value.replace(/\/$/, '');
}

const backendUrl = resolveBackendUrl();

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
}

interface Envelope<T> {
  data: T;
}

function secureCookies() {
  return process.env.NODE_ENV === 'production' || process.env.AUTH_COOKIE_SECURE === '1';
}

const baseCookie: Partial<ResponseCookie> = {
  httpOnly: true,
  secure: secureCookies(),
  sameSite: 'lax',
  path: '/',
};

function secondsFromDuration(duration: string, fallback: number) {
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) return fallback;
  const units = { s: 1, m: 60, h: 3600, d: 86400 };
  return Number(match[1]) * units[match[2] as keyof typeof units];
}

export async function setTokenCookies(tokens: TokenPair) {
  const store = await cookies();
  store.set(ACCESS_COOKIE, tokens.accessToken, {
    ...baseCookie,
    maxAge: secondsFromDuration(tokens.expiresIn, 15 * 60),
  });
  store.set(REFRESH_COOKIE, tokens.refreshToken, { ...baseCookie, maxAge: 30 * 24 * 60 * 60 });
}

export async function clearTokenCookies() {
  const store = await cookies();
  store.set(ACCESS_COOKIE, '', { ...baseCookie, maxAge: 0 });
  store.set(REFRESH_COOKIE, '', { ...baseCookie, maxAge: 0 });
}

export async function hasSessionCookie() {
  const store = await cookies();
  return Boolean(store.get(ACCESS_COOKIE)?.value || store.get(REFRESH_COOKIE)?.value);
}

export async function backendFetch(
  path: string,
  init: RequestInit = {},
  authenticated = false,
): Promise<Response> {
  const requestHeaders = new Headers(init.headers);
  requestHeaders.set('accept', 'application/json');
  if (authenticated) {
    const access = (await cookies()).get(ACCESS_COOKIE)?.value;
    if (access) requestHeaders.set('authorization', `Bearer ${access}`);
  }
  try {
    return await fetch(`${backendUrl}${path}`, {
      ...init,
      headers: requestHeaders,
      cache: 'no-store',
      signal: init.signal ?? AbortSignal.timeout(15_000),
    });
  } catch {
    return Response.json(
      {
        statusCode: 503,
        code: 'NETWORK_ERROR',
        message: 'The backend service is unavailable',
      },
      { status: 503 },
    );
  }
}

export async function refreshTokens(): Promise<boolean> {
  const store = await cookies();
  const refreshToken = store.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return false;
  const response = await backendFetch('/auth/refresh', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!response.ok) {
    await clearTokenCookies();
    return false;
  }
  const payload = (await response.json()) as Envelope<TokenPair>;
  await setTokenCookies(payload.data);
  return true;
}

export async function authenticatedFetch(path: string, init: RequestInit = {}) {
  let response = await backendFetch(path, init, true);
  if (response.status === 401 && (await refreshTokens())) {
    response = await backendFetch(path, init, true);
  }
  return response;
}

export async function validateMutationOrigin(request: Request) {
  const marker = request.headers.get('x-beautyflow-request');
  if (marker !== 'browser') return false;
  const origin = request.headers.get('origin');
  if (!origin) return true;
  const host = (await headers()).get('host');
  const expected = `${secureCookies() ? 'https' : 'http'}://${host}`;
  return origin === expected;
}

export async function safeUpstreamResponse(response: Response) {
  const text = await response.text();
  return new Response(text, {
    status: response.status,
    headers: {
      'content-type': response.headers.get('content-type') ?? 'application/json',
      ...(response.headers.get('x-request-id')
        ? { 'x-request-id': response.headers.get('x-request-id')! }
        : {}),
    },
  });
}

export type { Envelope, TokenPair };
