'use client';

import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { ApiError } from '@/lib/api/error';
import { useSetCatalogServiceActive } from '../hooks/use-services';
import type { CatalogService } from '../types/catalog-service';

export function ServiceStatusDialog({
  tenantId,
  service,
  returnFocus,
  onOpenChange,
}: {
  tenantId: string;
  service: CatalogService | null;
  returnFocus: HTMLElement | null;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations();
  const mutation = useSetCatalogServiceActive(tenantId);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const activating = service ? !service.isActive : false;

  function safeError(error: unknown) {
    if (!(error instanceof ApiError)) return t('services.statusFailed');
    if (error.code === 'NETWORK_ERROR' || error.code === 'REQUEST_TIMEOUT') {
      return t('errors.network');
    }
    if (error.status === 403) return t('errors.forbidden');
    if (error.code === 'CATALOG_SERVICE_NAME_EXISTS') return t('services.nameExistsActivate');
    if (error.code === 'CATALOG_SERVICE_CODE_EXISTS') return t('services.codeExistsActivate');
    const fallback = t('services.statusFailed');
    return error.requestId
      ? `${fallback} ${t('errors.requestId', { id: error.requestId })}`
      : fallback;
  }

  async function confirm() {
    if (!service || mutation.isPending) return;
    setErrorMessage(null);
    try {
      await mutation.mutateAsync({ serviceId: service.id, isActive: activating });
      toast.success(activating ? t('services.activated') : t('services.deactivated'));
      onOpenChange(false);
    } catch (error) {
      setErrorMessage(safeError(error));
    }
  }

  return (
    <Dialog
      open={Boolean(service)}
      onOpenChange={(open) => {
        if (!mutation.isPending) {
          setErrorMessage(null);
          onOpenChange(open);
        }
      }}
    >
      <DialogContent
        closeLabel={t('common.close')}
        onCloseAutoFocus={(event) => {
          if (returnFocus) {
            event.preventDefault();
            returnFocus.focus();
          }
        }}
      >
        <DialogTitle className="pe-8 font-display text-xl font-semibold">
          {activating ? t('services.activateTitle') : t('services.deactivateTitle')}
        </DialogTitle>
        <DialogDescription className="mt-3 text-sm leading-6 text-muted-foreground">
          {activating ? t('services.activateMessage') : t('services.deactivateMessage')}
        </DialogDescription>
        {errorMessage && (
          <p className="mt-4 text-sm text-destructive" role="alert" aria-live="assertive">
            {errorMessage}
          </p>
        )}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={mutation.isPending}>
              {t('common.cancel')}
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant={activating ? 'default' : 'destructive'}
            onClick={() => void confirm()}
            disabled={mutation.isPending}
          >
            {mutation.isPending && (
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            )}
            {mutation.isPending
              ? t('services.saving')
              : activating
                ? t('services.activate')
                : t('services.deactivate')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
