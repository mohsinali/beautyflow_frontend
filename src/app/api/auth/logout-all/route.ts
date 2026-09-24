import {
  authenticatedFetch,
  clearTokenCookies,
  safeUpstreamResponse,
  validateMutationOrigin,
} from '@/lib/auth/server';

export async function POST(request: Request) {
  if (!(await validateMutationOrigin(request))) {
    return Response.json(
      { code: 'INVALID_ORIGIN', message: 'Request origin is not allowed' },
      { status: 403 },
    );
  }
  const response = await authenticatedFetch('/auth/logout-all', { method: 'POST' });
  await clearTokenCookies();
  return response.ok
    ? Response.json({ data: { loggedOut: true } })
    : safeUpstreamResponse(response);
}
