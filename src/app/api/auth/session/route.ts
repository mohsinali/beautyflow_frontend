import { authenticatedFetch, clearTokenCookies, safeUpstreamResponse } from '@/lib/auth/server';
import type { Envelope } from '@/lib/auth/server';
import { permissionsForRoles } from '@/lib/permissions/permissions';
import type { BackendMe, Session, TenantSettings } from '@/types/session';

export async function GET() {
  const response = await authenticatedFetch('/auth/me');
  if (!response.ok) {
    if (response.status === 401) await clearTokenCookies();
    return safeUpstreamResponse(response);
  }
  const { data: me } = (await response.json()) as Envelope<BackendMe>;
  let settings: TenantSettings | null = null;
  if (me.tenant?.role === 'SALON_OWNER') {
    const settingsResponse = await authenticatedFetch('/tenant/settings');
    if (settingsResponse.ok) {
      settings = ((await settingsResponse.json()) as Envelope<TenantSettings>).data;
    }
  }
  const session: Session = {
    user: me.user,
    platformRole: me.platformRole,
    tenant: me.tenant
      ? {
          id: me.tenant.id,
          slug: me.tenant.slug,
          role: me.tenant.role,
          membershipId: null,
          name: settings?.name ?? me.tenant.slug,
          language: settings?.defaultLanguage ?? 'EN',
          currencyCode: settings?.currencyCode ?? 'PKR',
          timezone: settings?.timezone ?? me.accessibleBranches[0]?.timezone ?? 'UTC',
          settingsResolved: Boolean(settings),
        }
      : null,
    permissions: permissionsForRoles(me.platformRole, me.tenant?.role),
    accessibleBranches: me.accessibleBranches,
  };
  return Response.json({ data: session });
}
