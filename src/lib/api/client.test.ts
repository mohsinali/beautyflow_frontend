import { describe, expect, it, vi } from 'vitest';
import { apiRequest, resetRefreshCoordinator } from './client';

describe('apiRequest', () => {
  it('coordinates concurrent 401 refreshes and retries each request once', async () => {
    resetRefreshCoordinator();
    let refreshes = 0;
    let resourceCalls = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url === '/api/auth/refresh') {
        refreshes += 1;
        await Promise.resolve();
        return new Response('{}', { status: 200 });
      }
      resourceCalls += 1;
      return resourceCalls <= 2
        ? new Response(JSON.stringify({ code: 'UNAUTHORIZED' }), { status: 401 })
        : new Response(JSON.stringify({ ok: true }), { status: 200 });
    });
    const [a, b] = await Promise.all([
      apiRequest<{ ok: boolean }>('/api/backend/branches'),
      apiRequest<{ ok: boolean }>('/api/backend/branches'),
    ]);
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
    expect(refreshes).toBe(1);
  });

  it('adds a branch header only when requested', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => new Response('{}', { status: 200 }));
    await apiRequest('/api/backend/branches', { branchId: 'branch-1' });
    await apiRequest('/api/backend/tenant/settings');
    expect(new Headers(fetchSpy.mock.calls[0][1]?.headers).get('x-branch-id')).toBe('branch-1');
    expect(new Headers(fetchSpy.mock.calls[1][1]?.headers).has('x-branch-id')).toBe(false);
  });
});
