'use client';

import { DropdownMenu } from 'radix-ui';
import { LogOut, MonitorX } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { initials } from '@/lib/utils';
import { useSession } from '@/providers/session-provider';

export function UserMenu() {
  const t = useTranslations();
  const { session, logout } = useSession();
  const [confirmAll, setConfirmAll] = useState(false);
  const [pending, setPending] = useState(false);
  if (!session) return null;
  const doLogout = async (all = false) => {
    if (pending) return;
    setPending(true);
    await logout(all);
  };
  return (
    <Dialog open={confirmAll} onOpenChange={setConfirmAll}>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-muted text-primary"
            aria-label={t('header.account')}
          >
            {initials(session.user.firstName, session.user.lastName)}
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={8}
            className="z-50 w-64 rounded-xl border border-border bg-card p-2 text-card-foreground shadow-xl"
          >
            <div className="border-b border-border px-3 py-2">
              <p className="font-semibold">
                {session.user.firstName} {session.user.lastName}
              </p>
              <p className="truncate text-xs text-muted-foreground">{session.user.email}</p>
            </div>
            <DropdownMenu.Item
              disabled={pending}
              onSelect={() => void doLogout()}
              className="mt-1 flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm outline-none focus:bg-muted"
            >
              <LogOut className="size-4" />
              {t('auth.logout')}
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={() => setConfirmAll(true)}
              className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm text-destructive outline-none focus:bg-destructive/10"
            >
              <MonitorX className="size-4" />
              {t('auth.logoutAll')}
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      <DialogContent>
        <DialogTitle className="font-display text-xl font-semibold">
          {t('auth.logoutAll')}
        </DialogTitle>
        <DialogDescription className="mt-2 text-sm text-muted-foreground">
          {t('auth.logoutAllDescription')}
        </DialogDescription>
        <div className="mt-6 flex justify-end gap-3">
          <DialogClose asChild>
            <Button variant="outline">{t('common.cancel')}</Button>
          </DialogClose>
          <Button variant="destructive" disabled={pending} onClick={() => void doLogout(true)}>
            {t('auth.logoutAllConfirm')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
