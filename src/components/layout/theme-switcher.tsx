'use client';

import { DropdownMenu } from 'radix-ui';
import { Check, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations('header');
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant="outline" size="icon" aria-label={t('theme')}>
          <Sun className="size-4 dark:hidden" />
          <Moon className="hidden size-4 dark:block" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-36 rounded-xl border border-border bg-card p-1 text-card-foreground shadow-xl"
        >
          {(['light', 'dark', 'system'] as const).map((item) => (
            <DropdownMenu.Item
              key={item}
              onSelect={() => setTheme(item)}
              className="flex min-h-10 cursor-pointer items-center justify-between rounded-lg px-3 text-sm outline-none focus:bg-muted"
            >
              <span>{t(item)}</span>
              {theme === item && <Check className="size-4 text-secondary" />}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
