'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircle } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BranchSummary } from '@/types/session';
import { ApiError } from '@/lib/api/error';
import { useConfigureBranchService } from '../hooks/use-branch-services';
import {
  branchServiceSchema,
  type BranchServiceFormValues,
} from '../schemas/branch-service-schema';
import type { BranchService, ConfigureBranchServiceInput } from '../types/branch-service';

function valuesFor(service: BranchService | null): BranchServiceFormValues {
  return {
    isAvailable: service?.availabilityOverride ?? true,
    useOverride: service?.priceOverride !== null && service?.priceOverride !== undefined,
    priceOverride: service?.priceOverride ?? '',
  };
}

export function ConfigureBranchServiceDialog({
  tenantId,
  branch,
  currencyCode,
  service,
  returnFocus,
  onOpenChange,
}: {
  tenantId: string;
  branch: BranchSummary;
  currencyCode: string;
  service: BranchService | null;
  returnFocus: HTMLElement | null;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const mutation = useConfigureBranchService(tenantId, branch.id);
  const [pendingInput, setPendingInput] = useState<ConfigureBranchServiceInput | null>(null);
  const schema = useMemo(
    () => branchServiceSchema(t('branchServices.validation.priceInvalid')),
    [t],
  );
  const {
    register,
    handleSubmit,
    control,
    setError,
    setValue,
    formState: { errors },
  } = useForm<BranchServiceFormValues>({
    resolver: zodResolver(schema),
    defaultValues: valuesFor(service),
  });
  const useOverride = useWatch({ control, name: 'useOverride' });
  const priceOverride = useWatch({ control, name: 'priceOverride' });
  const priceFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [currencyCode, locale],
  );

  function safeError(error: unknown, fallback: string) {
    if (!(error instanceof ApiError)) return fallback;
    if (error.code === 'NETWORK_ERROR' || error.code === 'REQUEST_TIMEOUT') {
      return t('errors.network');
    }
    if (error.status === 403) return t('errors.forbidden');
    if (error.code === 'BRANCH_NOT_FOUND') return t('branchServices.branchUnavailable');
    if (error.code === 'CATALOG_SERVICE_NOT_FOUND') return t('branchServices.serviceUnavailable');
    return error.requestId
      ? `${fallback} ${t('errors.requestId', { id: error.requestId })}`
      : fallback;
  }

  async function save(input: ConfigureBranchServiceInput) {
    if (!service || mutation.isPending) return;
    const previousAvailable = service.availabilityOverride ?? true;
    const availabilityChanged = previousAvailable !== input.isAvailable;
    const overrideChanged = service.priceOverride !== input.priceOverride;
    try {
      await mutation.mutateAsync({ serviceId: service.id, input });
      if (availabilityChanged && overrideChanged) {
        toast.success(t('branchServices.configurationUpdated'));
      } else if (availabilityChanged) {
        toast.success(
          input.isAvailable
            ? t('branchServices.enabledSuccessfully')
            : t('branchServices.disabledSuccessfully'),
        );
      } else if (service.priceOverride !== null && input.priceOverride === null) {
        toast.success(t('branchServices.overrideRemovedSuccessfully'));
      } else {
        toast.success(t('branchServices.priceUpdatedSuccessfully'));
      }
      onOpenChange(false);
    } catch (error) {
      setPendingInput(null);
      if (error instanceof ApiError && error.code === 'VALIDATION_ERROR' && overrideChanged) {
        setError('priceOverride', {
          type: 'server',
          message: t('branchServices.validation.priceInvalid'),
        });
        return;
      }
      const fallback = availabilityChanged
        ? overrideChanged
          ? t('branchServices.updateFailed')
          : t('branchServices.availabilityUpdateFailed')
        : t('branchServices.priceUpdateFailed');
      setError('root', { type: 'server', message: safeError(error, fallback) });
    }
  }

  function submit(values: BranchServiceFormValues) {
    if (!service) return;
    const input: ConfigureBranchServiceInput = {
      isAvailable: values.isAvailable,
      priceOverride: values.useOverride ? values.priceOverride.trim() : null,
    };
    const currentlyAvailable = service.availabilityOverride ?? true;
    if (currentlyAvailable && !input.isAvailable) {
      setPendingInput(input);
      return;
    }
    void save(input);
  }

  if (!service) return null;
  const previewValue = useOverride && priceOverride ? priceOverride : service.defaultPrice;

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!mutation.isPending) onOpenChange(open);
      }}
    >
      <DialogContent
        closeLabel={t('common.close')}
        className="max-h-[calc(100vh-2rem)] max-w-xl overflow-y-auto"
        onCloseAutoFocus={(event) => {
          if (returnFocus) {
            event.preventDefault();
            returnFocus.focus();
          }
        }}
      >
        {pendingInput ? (
          <>
            <DialogTitle className="pe-8 font-display text-xl font-semibold">
              {t('branchServices.disableTitle')}
            </DialogTitle>
            <DialogDescription className="mt-3 text-sm leading-6 text-muted-foreground">
              {t('branchServices.disableMessage', { branch: branch.name })}
            </DialogDescription>
            {errors.root && (
              <p className="mt-4 text-sm text-destructive" role="alert">
                {errors.root.message}
              </p>
            )}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={mutation.isPending}
                onClick={() => setPendingInput(null)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={mutation.isPending}
                onClick={() => void save(pendingInput)}
              >
                {mutation.isPending && (
                  <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                )}
                {mutation.isPending
                  ? t('branchServices.saving')
                  : t('branchServices.disableService')}
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogTitle className="pe-8 font-display text-xl font-semibold">
              {t('branchServices.configureService')}
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm leading-6 text-muted-foreground">
              {t('branchServices.configureDescription', {
                service: service.name,
                branch: branch.name,
              })}
            </DialogDescription>
            <form className="mt-6 space-y-5" onSubmit={handleSubmit(submit)} noValidate>
              <div className="grid gap-3 rounded-xl bg-muted/55 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t('branchServices.activeBranch')}
                  </p>
                  <p className="mt-1 font-semibold" dir="auto">
                    {branch.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('branchServices.basePrice')}</p>
                  <p className="mt-1 font-semibold tabular-nums" dir="auto">
                    {priceFormatter.format(Number(service.defaultPrice))}
                  </p>
                </div>
              </div>

              <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-border p-3">
                <input
                  type="checkbox"
                  className="size-5 accent-primary"
                  aria-describedby="branch-service-availability-hint"
                  {...register('isAvailable')}
                />
                <span>
                  <span className="block text-sm font-semibold">
                    {t('branchServices.availableAtBranch')}
                  </span>
                  <span
                    id="branch-service-availability-hint"
                    className="block text-xs text-muted-foreground"
                  >
                    {t('branchServices.availabilityHint', { service: service.name })}
                  </span>
                </span>
              </label>

              <div className="space-y-3">
                <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-border p-3">
                  <input
                    type="checkbox"
                    className="size-5 accent-primary"
                    {...register('useOverride')}
                  />
                  <span className="text-sm font-semibold">
                    {t('branchServices.setPriceOverride')}
                  </span>
                </label>
                {useOverride && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor="branch-price-override">
                        {t('branchServices.priceOverride')}
                      </Label>
                      {service.priceOverride !== null && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setValue('useOverride', false, { shouldDirty: true })}
                        >
                          {t('branchServices.useBasePrice')}
                        </Button>
                      )}
                    </div>
                    <Input
                      id="branch-price-override"
                      type="text"
                      inputMode="decimal"
                      dir="ltr"
                      placeholder="0.00"
                      aria-invalid={Boolean(errors.priceOverride)}
                      aria-describedby="branch-price-hint branch-price-error"
                      {...register('priceOverride')}
                    />
                    <p id="branch-price-hint" className="text-xs text-muted-foreground">
                      {t('branchServices.priceHint', {
                        currency: currencyCode,
                        branch: branch.name,
                      })}
                    </p>
                    {errors.priceOverride && (
                      <p id="branch-price-error" className="text-sm text-destructive" role="alert">
                        {errors.priceOverride.message}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-xs text-muted-foreground">
                  {t('branchServices.effectivePrice')}
                </p>
                <p className="mt-1 text-lg font-semibold tabular-nums" dir="auto">
                  {priceFormatter.format(Number(previewValue))}
                </p>
                {!useOverride && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('branchServices.usesBasePrice')}
                  </p>
                )}
              </div>

              {errors.root && (
                <p className="text-sm text-destructive" role="alert" aria-live="assertive">
                  {errors.root.message}
                </p>
              )}
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <DialogClose asChild>
                  <Button type="button" variant="outline" disabled={mutation.isPending}>
                    {t('common.cancel')}
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending && (
                    <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                  )}
                  {mutation.isPending
                    ? t('branchServices.saving')
                    : t('branchServices.saveChanges')}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
