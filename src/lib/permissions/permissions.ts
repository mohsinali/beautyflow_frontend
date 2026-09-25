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
  serviceCategoryCreate: 'service-category:create',
  serviceCategoryRead: 'service-category:read',
  serviceCategoryUpdate: 'service-category:update',
  serviceCategoryDeactivate: 'service-category:deactivate',
  catalogRead: 'catalog-service:read',
  catalogCreate: 'catalog-service:create',
  catalogUpdate: 'catalog-service:update',
  catalogDeactivate: 'catalog-service:deactivate',
  catalogConfigureBranch: 'catalog-service:configure-branch',
  providerRead: 'service-provider:read',
  providerCreate: 'service-provider:create',
  providerUpdate: 'service-provider:update',
  providerDeactivate: 'service-provider:deactivate',
  providerManageQualifications: 'service-provider:manage-qualifications',
  customerCreate: 'customer:create',
  customerRead: 'customer:read',
  customerUpdate: 'customer:update',
  customerDeactivate: 'customer:deactivate',
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
  permissions.serviceCategoryCreate,
  permissions.serviceCategoryRead,
  permissions.serviceCategoryUpdate,
  permissions.serviceCategoryDeactivate,
  permissions.catalogRead,
  permissions.catalogCreate,
  permissions.catalogUpdate,
  permissions.catalogDeactivate,
  permissions.catalogConfigureBranch,
  permissions.providerRead,
  permissions.providerCreate,
  permissions.providerUpdate,
  permissions.providerDeactivate,
  permissions.providerManageQualifications,
  permissions.customerCreate,
  permissions.customerRead,
  permissions.customerUpdate,
  permissions.customerDeactivate,
];

const serviceProviderPermissions = [
  permissions.branchView,
  permissions.profileViewOwn,
  permissions.serviceCategoryRead,
  permissions.catalogRead,
  permissions.providerRead,
];

const receptionistPermissions = [
  ...serviceProviderPermissions,
  permissions.customerCreate,
  permissions.customerRead,
  permissions.customerUpdate,
  permissions.customerDeactivate,
];

export function permissionsForRoles(platformRole: PlatformRole | null, tenantRole?: TenantRole) {
  if (platformRole === 'SUPER_ADMIN') return [permissions.platformTenantView];
  if (tenantRole === 'SALON_OWNER') return ownerPermissions;
  if (tenantRole === 'RECEPTIONIST') return receptionistPermissions;
  return tenantRole === 'SERVICE_PROVIDER' ? serviceProviderPermissions : [];
}
