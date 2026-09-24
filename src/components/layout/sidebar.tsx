'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Brand } from './brand';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { navigationFor } from '@/components/navigation/navigation-config';
import type { Session } from '@/types/session';

export function Sidebar({
  session,
  collapsed,
  onCollapse,
  mobile = false,
  onNavigate,
}: {
  session: Session;
  collapsed: boolean;
  onCollapse?: () => void;
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  const t = useTranslations();
  const pathname = usePathname();
  const items = navigationFor(session);
  return (
    <aside
      className={cn(
        'flex h-full flex-col bg-sidebar text-sidebar-foreground',
        mobile ? 'w-[min(86vw,320px)]' : collapsed ? 'w-[84px]' : 'w-[264px]',
      )}
      aria-label="Primary navigation"
    >
      <div className="flex h-20 items-center border-b border-white/10 px-5">
        <Brand compact={collapsed && !mobile} dark />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            !item.disabled &&
            ((item.key === 'catalog' && pathname.startsWith('/dashboard/catalog/')) ||
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`)));
          const content = (
            <>
              <Icon className="size-5 shrink-0" aria-hidden="true" />
              {(!collapsed || mobile) && (
                <span className="min-w-0 flex-1 truncate text-start">{t(`nav.${item.key}`)}</span>
              )}
              {item.disabled && (!collapsed || mobile) && (
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium">
                  {t('common.comingSoon')}
                </span>
              )}
            </>
          );
          return item.disabled ? (
            <div
              key={item.key}
              className="flex min-h-11 cursor-not-allowed items-center gap-3 rounded-xl px-3 text-sm text-sidebar-foreground/55"
              aria-disabled="true"
              title={collapsed ? t(`nav.${item.key}`) : undefined}
            >
              {content}
            </div>
          ) : (
            <Link
              key={item.key}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              title={collapsed ? t(`nav.${item.key}`) : undefined}
              className={cn(
                'focus-ring flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors hover:bg-sidebar-hover',
                active && 'bg-sidebar-active text-white shadow-sm',
              )}
            >
              {content}
            </Link>
          );
        })}
      </nav>
      {!mobile && onCollapse && (
        <div className="border-t border-white/10 p-3">
          <Button
            variant="ghost"
            className="w-full text-sidebar-foreground hover:bg-sidebar-hover hover:text-white"
            onClick={onCollapse}
            aria-label={collapsed ? t('nav.expand') : t('nav.collapse')}
          >
            {collapsed ? (
              <ChevronRight className="size-5 rtl:rotate-180" />
            ) : (
              <>
                <ChevronLeft className="size-5 rtl:rotate-180" />
                <span>{t('nav.collapse')}</span>
              </>
            )}
          </Button>
        </div>
      )}
    </aside>
  );
}
