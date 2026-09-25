import { backendFetch, safeUpstreamResponse, validateMutationOrigin } from '@/lib/auth/server';

export async function POST(request: Request, context: { params: Promise<{ action: string }> }) {
  if (!(await validateMutationOrigin(request)))
    return Response.json(
      { code: 'INVALID_ORIGIN', message: 'Request origin is not allowed' },
      { status: 403 },
    );
  const { action } = await context.params;
  if (!['validate', 'accept'].includes(action))
    return Response.json({ code: 'NOT_FOUND', message: 'Route is not available' }, { status: 404 });
  const response = await backendFetch(`/auth/invitations/${action}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: await request.text(),
  });
  return safeUpstreamResponse(response);
}
