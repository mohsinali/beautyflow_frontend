import {
  authenticatedFetch,
  safeUpstreamResponse,
  validateMutationOrigin,
} from '@/lib/auth/server';

const allowed = [
  /^branches(?:\/[^/]+)?$/,
  /^branches\/[^/]+\/catalog-services(?:\/[^/]+)?$/,
  /^tenant\/settings$/,
  /^platform\/tenants(?:\/[^/]+)?$/,
  /^service-categories(?:\/[^/]+(?:\/(?:deactivate|reactivate))?)?$/,
  /^catalog-services(?:\/[^/]+(?:\/(?:deactivate|reactivate))?)?$/,
  /^service-providers(?:\/(?:available-memberships|onboard|[^/]+(?:\/(?:deactivate|reactivate|photo|resend-invitation|qualifications(?:\/[^/]+)?))?))?$/,
  /^memberships\/[^/]+\/branches\/[^/]+$/,
  /^customers(?:\/[^/]+(?:\/(?:deactivate|reactivate))?)?$/,
];

async function proxy(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const joined = path.join('/');
  if (!allowed.some((pattern) => pattern.test(joined))) {
    return Response.json(
      { code: 'PROXY_PATH_NOT_ALLOWED', message: 'Route is not available' },
      { status: 404 },
    );
  }
  if (!['GET', 'HEAD'].includes(request.method) && !(await validateMutationOrigin(request))) {
    return Response.json(
      { code: 'INVALID_ORIGIN', message: 'Request origin is not allowed' },
      { status: 403 },
    );
  }
  const source = new URL(request.url);
  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  const branchId = request.headers.get('x-branch-id');
  if (contentType) headers.set('content-type', contentType);
  if (branchId) headers.set('x-branch-id', branchId);
  const response = await authenticatedFetch(`/${joined}${source.search}`, {
    method: request.method,
    headers,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer(),
  });
  return safeUpstreamResponse(response);
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
