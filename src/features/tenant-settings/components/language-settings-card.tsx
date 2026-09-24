'use client';

import { Languages, LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useUpdateTenantLanguage } from '../hooks/use-update-tenant-language';
import { ApiError } from '@/lib/api/error';
import { permissions } from '@/lib/permissions/permissions';
import { usePermissions, useSession } from '@/providers/session-provider';
import type { TenantLanguage } from '@/types/session';

export function LanguageSettingsCard() {
  const t = useTranslations();
  const { session, refreshSession } = useSession();
  const { can } = usePermissions();
  const tenant = session?.tenant ?? null;
  const savedLanguage = tenant?.language ?? null;
  const [pendingLanguage, setPendingLanguage] = useState<TenantLanguage | null>(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const lastNotifiedLanguage = useRef<TenantLanguage | null>(null);
  const mutation = useUpdateTenantLanguage();
  const canUpdate = can(permissions.tenantSettingsUpdate);
  const selectedLanguage = pendingLanguage ?? savedLanguage ?? 'EN';
  const changed = savedLanguage !== null && selectedLanguage !== savedLanguage;

  useEffect(() => {
    const confirmedLanguage = mutation.data?.defaultLanguage;
    if (
      mutation.isSuccess &&
      confirmedLanguage &&
      savedLanguage === confirmedLanguage &&
      lastNotifiedLanguage.current !== confirmedLanguage
    ) {
      lastNotifiedLanguage.current = confirmedLanguage;
      toast.success(t('settings.updated'));
    }
  }, [mutation.data, mutation.isSuccess, savedLanguage, t]);

  function safeError(error: unknown) {
    if (!(error instanceof ApiError)) return t('settings.updateFailed');
    if (error.code === 'NETWORK_ERROR' || error.code === 'REQUEST_TIMEOUT') {
      return t('errors.network');
    }
    if (error.status === 400) return t('errors.validation');
    if (error.status === 403) return t('errors.forbidden');
    if (error.status === 404) return t('settings.notFound');
    if (error.status === 409) return t('settings.conflict');
    const message = t('settings.updateFailed');
    return error.requestId
      ? `${message} ${t('errors.requestId', { id: error.requestId })}`
      : message;
  }

  function requestSave() {
    if (!changed || mutation.isPending || !tenant || !canUpdate) return;
    setErrorMessage(null);
    mutation.reset();
    setConfirmationOpen(true);
  }

  async function confirmSave() {
    if (!changed || mutation.isPending || !tenant || !canUpdate) return;
    try {
      await mutation.mutateAsync(selectedLanguage);
      setPendingLanguage(null);
      setConfirmationOpen(false);
    } catch (error) {
      const message = safeError(error);
      setPendingLanguage(null);
      setConfirmationOpen(false);
      setErrorMessage(message);
      toast.error(message);
      if (error instanceof ApiError && error.status === 401) await refreshSession();
    }
  }

  const languageName = (language: TenantLanguage) =>
    t(language === 'AR' ? 'settings.arabic' : 'settings.english');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Languages className="size-5 text-secondary" aria-hidden="true" />
          {t('settings.applicationLanguage')}
        </CardTitle>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {t('settings.languageExplanation')}
        </p>
      </CardHeader>
      <CardContent>
        <div className="max-w-md space-y-2">
          <Label htmlFor="tenant-language">{t('settings.applicationLanguage')}</Label>
          <select
            id="tenant-language"
            value={selectedLanguage}
            onChange={(event) => {
              setPendingLanguage(event.target.value as TenantLanguage);
              setErrorMessage(null);
              mutation.reset();
            }}
            disabled={!tenant || !canUpdate || mutation.isPending}
            aria-describedby="tenant-language-description tenant-language-status"
            className="min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-start text-sm text-foreground shadow-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/35 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="EN">{t('settings.english')}</option>
            <option value="AR">{t('settings.arabic')}</option>
          </select>
          <p id="tenant-language-description" className="text-xs leading-5 text-muted-foreground">
            {savedLanguage
              ? t('settings.currentLanguage', { language: languageName(savedLanguage) })
              : t('common.unknown')}
          </p>
          <div id="tenant-language-status" aria-live="polite" aria-atomic="true">
            {errorMessage && (
              <p className="text-sm text-destructive" role="alert">
                {errorMessage}
              </p>
            )}
          </div>
        </div>
        <Button
          type="button"
          className="mt-5"
          onClick={requestSave}
          disabled={!changed || mutation.isPending || !tenant || !canUpdate}
        >
          {mutation.isPending && (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          )}
          {mutation.isPending ? t('settings.saving') : t('settings.save')}
        </Button>
      </CardContent>

      <Dialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <DialogContent closeLabel={t('common.close')}>
          <DialogTitle className="pe-8 text-lg font-semibold">
            {t('settings.confirmTitle')}
          </DialogTitle>
          <DialogDescription className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
            <span className="block">{t('settings.tenantWideWarning')}</span>
            <span className="block">{t('settings.dataUnchanged')}</span>
          </DialogDescription>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={mutation.isPending}>
                {t('common.cancel')}
              </Button>
            </DialogClose>
            <Button type="button" onClick={() => void confirmSave()} disabled={mutation.isPending}>
              {mutation.isPending && (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              )}
              {mutation.isPending ? t('settings.saving') : t('settings.changeLanguage')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
