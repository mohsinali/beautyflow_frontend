import {
  BarChart3,
  Building2,
  CalendarHeart,
  ContactRound,
  LayoutDashboard,
  Scissors,
  Settings,
  ShoppingBag,
  BadgePlus,
  Store,
  UsersRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { permissions } from '@/lib/permissions/permissions';
import type { Session, TenantRole } from '@/types/session';

export interface NavigationItem {
  key: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
}

const owner: NavigationItem[] = [
  { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { key: 'catalog', href: '/dashboard/catalog/categories', icon: Scissors },
  { key: 'providers', href: '/dashboard/service-providers', icon: ContactRound },
  { key: 'customers', href: '/dashboard/customers', icon: UsersRound },
  { key: 'pos', href: '/dashboard/pos', icon: BadgePlus },
  { key: 'visits', href: '/dashboard/visits', icon: ShoppingBag },
  { key: 'reports', href: '/dashboard/reports', icon: BarChart3 },
  { key: 'branches', href: '/dashboard/branches', icon: Store },
  { key: 'staff', href: '#staff', icon: CalendarHeart, disabled: true },
  { key: 'settings', href: '/dashboard/settings', icon: Settings },
];

const byTenantRole: Record<TenantRole, NavigationItem[]> = {
  SALON_OWNER: owner,
  RECEPTIONIST: owner.filter((item) =>
    ['dashboard', 'catalog', 'providers', 'customers', 'pos', 'visits'].includes(item.key),
  ),
  SERVICE_PROVIDER: owner.filter((item) => ['dashboard', 'catalog'].includes(item.key)),
};

const platform: NavigationItem[] = [
  { key: 'platformDashboard', href: '/dashboard', icon: LayoutDashboard },
  { key: 'tenants', href: '#tenants', icon: Building2, disabled: true },
];

export function navigationFor(session: Session) {
  if (session.platformRole === 'SUPER_ADMIN') return platform;
  if (!session.tenant) return [];
  return byTenantRole[session.tenant.role]
    .filter((item) => {
      if (item.key === 'catalog') {
        return (
          session.permissions.includes(permissions.serviceCategoryRead) ||
          session.permissions.includes(permissions.catalogRead)
        );
      }
      if (item.key === 'providers') return session.permissions.includes(permissions.providerRead);
      if (item.key === 'customers') return session.permissions.includes(permissions.customerRead);
      if (item.key === 'pos') return session.permissions.includes(permissions.visitCreate);
      if (item.key === 'visits') return session.permissions.includes(permissions.visitRead);
      if (item.key === 'reports') return session.permissions.includes(permissions.reportView);
      if (item.key === 'branches') return session.permissions.includes(permissions.branchView);
      return (
        item.key !== 'settings' || session.permissions.includes(permissions.tenantSettingsView)
      );
    })
    .map((item) =>
      item.key === 'catalog' && !session.permissions.includes(permissions.serviceCategoryRead)
        ? { ...item, href: '/dashboard/catalog/services' }
        : item,
    );
}
