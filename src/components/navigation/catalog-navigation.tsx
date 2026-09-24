'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { permissions } from '@/lib/permissions/permissions';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/providers/session-provider';

export function CatalogNavigation() {
  const t = useTranslations('catalogNavigation');
  const pathname = usePathname();
  const { can } = usePermissions();
  const items = [
    can(permissions.serviceCategoryRead)
      ? { href: '/dashboard/catalog/categories', label: t('categories') }
      : null,
    can(permissions.catalogRead)
      ? { href: '/dashboard/catalog/services', label: t('services') }
      : null,
    can(permissions.catalogRead)
      ? { href: '/dashboard/catalog/branch-services', label: t('branchServices') }
      : null,
  ].filter((item): item is { href: string; label: string } => Boolean(item));

  if (items.length < 2) return null;

  return (
    <nav
      className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1"
      aria-label={t('label')}
    >
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'focus-ring min-h-10 shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
              active ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted',
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
