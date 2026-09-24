import { clearTokenCookies, refreshTokens, validateMutationOrigin } from '@/lib/auth/server';

export async function POST(request: Request) {
  if (!(await validateMutationOrigin(request))) {
    return Response.json(
      { code: 'INVALID_ORIGIN', message: 'Request origin is not allowed' },
      { status: 403 },
    );
  }
  if (await refreshTokens()) return Response.json({ data: { refreshed: true } });
  await clearTokenCookies();
  return Response.json({ code: 'SESSION_EXPIRED', message: 'Session expired' }, { status: 401 });
}
