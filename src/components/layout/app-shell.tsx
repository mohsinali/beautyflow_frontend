'use client';

import { Dialog } from 'radix-ui';
import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/feedback/error-state';
import { FullPageLoading } from '@/components/feedback/full-page-loading';
import { useSession } from '@/providers/session-provider';

export function AppShell({ children }: { children: ReactNode }) {
  const t = useTranslations('common');
  const { session, isLoading, error, refreshSession } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  if (isLoading) return <FullPageLoading />;
  if (error || !session)
    return (
      <main className="grid min-h-screen place-items-center p-6">
        <div className="w-full max-w-md">
          <ErrorState
            error={error ?? new Error('Session unavailable')}
            onRetry={() => void refreshSession()}
          />
        </div>
      </main>
    );
  return (
    <div className="flex min-h-screen bg-background">
      <a
        href="#main-content"
        className="focus-ring fixed start-4 top-3 z-[100] -translate-y-20 rounded-lg bg-primary px-4 py-2 text-primary-foreground focus:translate-y-0"
      >
        {t('skipToContent')}
      </a>
      <div className="fixed inset-y-0 start-0 z-40 hidden lg:block">
        <Sidebar
          session={session}
          collapsed={collapsed}
          onCollapse={() => setCollapsed((value) => !value)}
        />
      </div>
      <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/55 lg:hidden" />
          <Dialog.Content
            className="fixed inset-y-0 start-0 z-50 outline-none lg:hidden"
            aria-label={t('appName')}
          >
            <Sidebar
              session={session}
              collapsed={false}
              mobile
              onNavigate={() => setMobileOpen(false)}
            />
            <Dialog.Close asChild>
              <Button
                size="icon"
                variant="ghost"
                className="absolute end-3 top-5 text-sidebar-foreground hover:bg-sidebar-hover"
                aria-label={t('close')}
              >
                <X className="size-5" />
              </Button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <div className={collapsed ? 'min-w-0 flex-1 lg:ms-[84px]' : 'min-w-0 flex-1 lg:ms-[264px]'}>
        <Header onOpenMenu={() => setMobileOpen(true)} />
        <main id="main-content" className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
