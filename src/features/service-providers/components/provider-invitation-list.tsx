'use client';

import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Mail,
  Pencil,
  RotateCw,
  XCircle,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { ErrorState } from '@/components/feedback/error-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { permissions } from '@/lib/permissions/permissions';
import { cn } from '@/lib/utils';
import { usePermissions, useSession } from '@/providers/session-provider';
import {
  useCancelProviderInvitation,
  useProviderInvitations,
  useResendManagedProviderInvitation,
  useUpdateProviderInvitationEmail,
} from '../hooks/use-service-providers';
import type { ProviderInvitation, ProviderInvitationStatus } from '../types/service-provider';

export function ProviderInvitationList() {
  const t = useTranslations();
  const locale = useLocale();
  const { session } = useSession();
  const { can } = usePermissions();
  const tenantId = session?.tenant?.id ?? '';
  const canManage = can(permissions.providerCreate);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<ProviderInvitation | null>(null);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const query = useProviderInvitations(tenantId, page, canManage);
  const resend = useResendManagedProviderInvitation(tenantId);
  const updateEmail = useUpdateProviderInvitationEmail(tenantId);
  const cancel = useCancelProviderInvitation(tenantId);
  const date = (value: string) =>
    new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(value));
  const mutable = (item: ProviderInvitation) => item.status === 'PENDING';
  const resendable = (item: ProviderInvitation) => ['PENDING', 'EXPIRED'].includes(item.status);

  async function resendInvitation(item: ProviderInvitation) {
    try {
      const result = await resend.mutateAsync(item.id);
      toast[result.invitationStatus === 'SENT' ? 'success' : 'warning'](
        result.invitationStatus === 'SENT'
          ? t('providers.invitationManagement.resent')
          : t('providers.invitationPendingNotice'),
      );
    } catch {
      toast.error(t('providers.invitationManagement.resendFailed'));
    }
  }

  async function cancelInvitation(item: ProviderInvitation) {
    if (!window.confirm(t('providers.invitationManagement.cancelMessage'))) return;
    try {
      await cancel.mutateAsync(item.id);
      toast.success(t('providers.invitationManagement.cancelled'));
    } catch {
      toast.error(t('providers.invitationManagement.cancelFailed'));
    }
  }

  async function saveEmail() {
    if (!editing) return;
    const nextEmail = email.trim().toLowerCase();
    if (!nextEmail || !/^\S+@\S+\.\S+$/.test(nextEmail)) {
      setEmailError(t('providers.invitationManagement.emailInvalid'));
      return;
    }
    try {
      const result = await updateEmail.mutateAsync({ invitationId: editing.id, email: nextEmail });
      toast[result.invitationStatus === 'SENT' ? 'success' : 'warning'](
        result.invitationStatus === 'SENT'
          ? t('providers.invitationManagement.updated')
          : t('providers.invitationPendingNotice'),
      );
      setEditing(null);
    } catch {
      setEmailError(t('providers.invitationManagement.updateFailed'));
    }
  }

  if (!canManage || !tenantId)
    return (
      <ErrorState
        title={t('unauthorized.title')}
        error={new Error(t('unauthorized.description'))}
      />
    );
  const items = query.data?.items ?? [];
  const status = (value: ProviderInvitationStatus) => (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
        value === 'PENDING'
          ? 'bg-warning/15 text-warning-foreground'
          : value === 'ACCEPTED'
            ? 'bg-success/12 text-success'
            : 'bg-muted text-muted-foreground',
      )}
    >
      {t(`providers.invitationManagement.statuses.${value}`)}
    </span>
  );
  const actions = (item: ProviderInvitation) => (
    <div className="flex flex-wrap justify-end gap-1">
      {resendable(item) && (
        <Button
          size="sm"
          variant="ghost"
          disabled={resend.isPending}
          onClick={() => void resendInvitation(item)}
        >
          <RotateCw className="size-4" />
          {t('providers.resendInvitation')}
        </Button>
      )}
      {mutable(item) && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setEditing(item);
            setEmail(item.email);
            setEmailError('');
          }}
        >
          <Pencil className="size-4" />
          {t('providers.invitationManagement.editEmail')}
        </Button>
      )}
      {mutable(item) && (
        <Button
          size="sm"
          variant="ghost"
          disabled={cancel.isPending}
          onClick={() => void cancelInvitation(item)}
        >
          <XCircle className="size-4" />
          {t('providers.invitationManagement.cancel')}
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold">{t('providers.title')}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          {t('providers.invitationManagement.description')}
        </p>
      </header>
      <nav className="flex gap-2 border-b" aria-label={t('providers.views')}>
        <Button variant="ghost" className="rounded-b-none" asChild>
          <Link href="/dashboard/service-providers">{t('providers.providersTab')}</Link>
        </Button>
        <Button variant="ghost" className="rounded-b-none border-b-2 border-primary" asChild>
          <Link href="/dashboard/service-providers?view=invitations">
            {t('providers.invitationsTab')}
          </Link>
        </Button>
      </nav>
      {query.isLoading ? (
        <Card role="status">
          <CardContent className="py-14 text-center">
            <LoaderCircle className="mx-auto size-7 animate-spin text-secondary" />
            <p className="mt-3 text-sm text-muted-foreground">
              {t('providers.invitationManagement.loading')}
            </p>
          </CardContent>
        </Card>
      ) : query.isError ? (
        <ErrorState
          error={query.error}
          title={t('providers.invitationManagement.loadFailed')}
          onRetry={() => void query.refetch()}
        />
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center">
            <Mail className="mx-auto size-10 text-secondary" />
            <h2 className="mt-4 font-semibold">{t('providers.invitationManagement.empty')}</h2>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 md:hidden">
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="space-y-3 pt-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold" dir="auto">
                        {item.name}
                      </p>
                      <p className="truncate text-sm text-muted-foreground" dir="ltr">
                        {item.email}
                      </p>
                    </div>
                    {status(item.status)}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {t('providers.invitationManagement.invitedOn')}
                      </p>
                      <p>{date(item.invitedAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {t('providers.invitationManagement.expiresOn')}
                      </p>
                      <p>{date(item.expiresAt)}</p>
                    </div>
                  </div>
                  {actions(item)}
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/70 text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 text-start font-medium">
                      {t('providers.displayName')}
                    </th>
                    <th className="px-5 py-3 text-start font-medium">{t('providers.email')}</th>
                    <th className="px-5 py-3 text-start font-medium">{t('providers.status')}</th>
                    <th className="px-5 py-3 text-start font-medium">
                      {t('providers.invitationManagement.invitedOn')}
                    </th>
                    <th className="px-5 py-3 text-start font-medium">
                      {t('providers.invitationManagement.expiresOn')}
                    </th>
                    <th className="px-5 py-3 text-end font-medium">{t('providers.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-5 py-4 font-semibold" dir="auto">
                        {item.name}
                      </td>
                      <td className="px-5 py-4" dir="ltr">
                        {item.email}
                      </td>
                      <td className="px-5 py-4">{status(item.status)}</td>
                      <td className="px-5 py-4">{date(item.invitedAt)}</td>
                      <td className="px-5 py-4">{date(item.expiresAt)}</td>
                      <td className="px-5 py-4">{actions(item)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
      {query.data && query.data.meta.pageCount > 1 && (
        <nav className="flex items-center justify-between">
          <Button
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((value) => value - 1)}
          >
            <ChevronLeft className="size-4 rtl:rotate-180" />
            {t('providers.previous')}
          </Button>
          <p className="text-sm text-muted-foreground">
            {t('providers.page', { page, total: query.data.meta.pageCount })}
          </p>
          <Button
            variant="outline"
            disabled={page >= query.data.meta.pageCount}
            onClick={() => setPage((value) => value + 1)}
          >
            {t('providers.next')}
            <ChevronRight className="size-4 rtl:rotate-180" />
          </Button>
        </nav>
      )}
      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open && !updateEmail.isPending) setEditing(null);
        }}
      >
        <DialogContent closeLabel={t('common.close')}>
          <DialogTitle className="text-xl font-semibold">
            {t('providers.invitationManagement.editEmail')}
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            {t('providers.invitationManagement.editDescription')}
          </DialogDescription>
          <div className="mt-5 space-y-4">
            <div>
              <Label>{t('providers.invitationManagement.currentEmail')}</Label>
              <p className="mt-2 text-sm" dir="ltr">
                {editing?.email}
              </p>
            </div>
            <div>
              <Label htmlFor="invitation-email">
                {t('providers.invitationManagement.newEmail')}
              </Label>
              <Input
                id="invitation-email"
                className="mt-2"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setEmailError('');
                }}
                aria-invalid={Boolean(emailError)}
                dir="ltr"
              />
              {emailError && (
                <p className="mt-1 text-sm text-destructive" role="alert">
                  {emailError}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button variant="outline" disabled={updateEmail.isPending}>
                  {t('common.cancel')}
                </Button>
              </DialogClose>
              <Button
                disabled={updateEmail.isPending || email.trim().toLowerCase() === editing?.email}
                onClick={() => void saveEmail()}
              >
                {t('providers.invitationManagement.saveAndSend')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
