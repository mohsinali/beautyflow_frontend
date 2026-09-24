import type { PlatformRole, TenantRole } from '@/types/session';

export const permissions = {
  tenantSettingsView: 'tenant.settings.view',
  tenantSettingsUpdate: 'tenant.settings.update',
  branchCreate: 'branch.create',
  branchView: 'branch.view',
  branchUpdate: 'branch.update',
  branchDeactivate: 'branch.deactivate',
  staffCreate: 'staff.create',
  staffView: 'staff.view',
  staffUpdate: 'staff.update',
  staffSuspend: 'staff.suspend',
  membershipRoleAssign: 'membership.role.assign',
  branchAccessAssign: 'branch.access.assign',
  profileViewOwn: 'profile.view.own',
  catalogRead: 'catalog-service:read',
  providerRead: 'service-provider:read',
  platformTenantView: 'platform.tenant.view',
} as const;

const ownerPermissions = [
  permissions.tenantSettingsView,
  permissions.tenantSettingsUpdate,
  permissions.branchCreate,
  permissions.branchView,
  permissions.branchUpdate,
  permissions.branchDeactivate,
  permissions.staffCreate,
  permissions.staffView,
  permissions.staffUpdate,
  permissions.staffSuspend,
  permissions.membershipRoleAssign,
  permissions.branchAccessAssign,
  permissions.profileViewOwn,
  permissions.catalogRead,
  permissions.providerRead,
];

const staffPermissions = [
  permissions.branchView,
  permissions.profileViewOwn,
  permissions.catalogRead,
  permissions.providerRead,
];

export function permissionsForRoles(platformRole: PlatformRole | null, tenantRole?: TenantRole) {
  if (platformRole === 'SUPER_ADMIN') return [permissions.platformTenantView];
  if (tenantRole === 'SALON_OWNER') return ownerPermissions;
  return tenantRole ? staffPermissions : [];
}
