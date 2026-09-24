export type PlatformRole = 'SUPER_ADMIN';
export type TenantRole = 'SALON_OWNER' | 'RECEPTIONIST' | 'SERVICE_PROVIDER';
export type TenantLanguage = 'EN' | 'AR';

export interface UserSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface BranchSummary {
  id: string;
  name: string;
  code: string;
  timezone: string;
}

export interface TenantSummary {
  id: string;
  name: string;
  slug: string;
  role: TenantRole;
  membershipId: string | null;
  language: TenantLanguage;
  currencyCode: string;
  timezone: string;
  settingsResolved: boolean;
}

export interface Session {
  user: UserSummary;
  platformRole: PlatformRole | null;
  tenant: TenantSummary | null;
  permissions: string[];
  accessibleBranches: BranchSummary[];
}

export interface BackendMe {
  user: UserSummary;
  platformRole: PlatformRole | null;
  tenant: { id: string; slug: string; role: TenantRole } | null;
  accessibleBranches: BranchSummary[];
}

export interface TenantSettings {
  id: string;
  name: string;
  slug: string;
  defaultLanguage: TenantLanguage;
  currencyCode: string;
  timezone: string;
}
