import {
  backendFetch,
  safeUpstreamResponse,
  setTokenCookies,
  validateMutationOrigin,
} from '@/lib/auth/server';
import type { Envelope, TokenPair } from '@/lib/auth/server';

export async function POST(request: Request) {
  if (!(await validateMutationOrigin(request))) {
    return Response.json(
      { code: 'INVALID_ORIGIN', message: 'Request origin is not allowed' },
      { status: 403 },
    );
  }
  const body = await request.text();
  const response = await backendFetch('/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  });
  if (!response.ok) return safeUpstreamResponse(response);
  const payload = (await response.json()) as Envelope<TokenPair>;
  await setTokenCookies(payload.data);
  return Response.json({ data: { authenticated: true } });
}
