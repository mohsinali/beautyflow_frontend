import { describe, expect, it } from 'vitest';
import { navigationFor } from './navigation-config';
import type { Session, TenantRole } from '@/types/session';

function session(role: TenantRole): Session {
  return {
    user: { id: 'u', email: 'a@b.co', firstName: 'A', lastName: 'B' },
    platformRole: null,
    tenant: {
      id: 't',
      name: 'Tenant',
      slug: 'tenant',
      role,
      membershipId: null,
      language: 'EN',
      currencyCode: 'PKR',
      timezone: 'UTC',
      settingsResolved: true,
    },
    permissions: [],
    accessibleBranches: [],
  };
}

describe('navigationFor', () => {
  it('keeps platform navigation separate from tenant navigation', () => {
    const platform = navigationFor({
      ...session('SALON_OWNER'),
      platformRole: 'SUPER_ADMIN',
      tenant: null,
    });
    expect(platform.map((item) => item.key)).toEqual(['platformDashboard', 'tenants']);
    expect(platform.some((item) => item.key === 'catalog')).toBe(false);
  });

  it('limits service providers and distinguishes owner from receptionist', () => {
    const owner = navigationFor(session('SALON_OWNER')).map((item) => item.key);
    const receptionist = navigationFor(session('RECEPTIONIST')).map((item) => item.key);
    const provider = navigationFor(session('SERVICE_PROVIDER')).map((item) => item.key);
    expect(owner).toContain('settings');
    expect(receptionist).not.toContain('settings');
    expect(provider).toEqual(['dashboard', 'catalog', 'providers']);
  });
});
