'use client';

import { Menu } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Brand } from './brand';
import { BranchSelector } from './branch-selector';
import { ThemeSwitcher } from './theme-switcher';
import { UserMenu } from './user-menu';

export function Header({ onOpenMenu }: { onOpenMenu: () => void }) {
  const t = useTranslations();
  return (
    <header className="sticky top-0 z-30 flex min-h-20 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onOpenMenu}
        aria-label={t('nav.openMenu')}
      >
        <Menu className="size-5" />
      </Button>
      <div className="lg:hidden">
        <Brand compact />
      </div>
      <div className="ms-auto flex items-center gap-2 sm:gap-3">
        <div className="hidden sm:block">
          <BranchSelector />
        </div>
        <ThemeSwitcher />
        <UserMenu />
      </div>
      <div className="basis-full sm:hidden">
        <BranchSelector />
      </div>
    </header>
  );
}
