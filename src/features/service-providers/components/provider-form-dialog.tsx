'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
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
import { ApiError } from '@/lib/api/error';
import { providerSchema, type ProviderFormValues } from '../schemas/provider-schema';
import {
  useAvailableProviderMemberships,
  useCreateServiceProvider,
  useUpdateServiceProvider,
} from '../hooks/use-service-providers';
import type { ServiceProvider } from '../types/service-provider';

const valuesFor = (provider: ServiceProvider | null): ProviderFormValues => ({
  membershipId: provider?.membershipId ?? '',
  displayName: provider?.displayName ?? '',
  phone: provider?.phone ?? '',
  jobTitle: provider?.jobTitle ?? '',
  bio: provider?.bio ?? '',
});

export function ProviderFormDialog({
  tenantId,
  open,
  provider,
  returnFocus,
  onCreated,
  onOpenChange,
}: {
  tenantId: string;
  open: boolean;
  provider: ServiceProvider | null;
  returnFocus: HTMLElement | null;
  onCreated?: (provider: ServiceProvider) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations();
  const memberships = useAvailableProviderMemberships(tenantId, open && !provider);
  const create = useCreateServiceProvider(tenantId);
  const update = useUpdateServiceProvider(tenantId);
  const resetCreate = create.reset;
  const resetUpdate = update.reset;
  const mutation = provider ? update : create;
  const schema = useMemo(
    () =>
      providerSchema({
        membershipRequired: t('providers.validation.membershipRequired'),
        nameRequired: t('providers.validation.nameRequired'),
        nameTooLong: t('providers.validation.nameTooLong'),
        phoneTooLong: t('providers.validation.phoneTooLong'),
        jobTitleTooLong: t('providers.validation.jobTitleTooLong'),
        bioTooLong: t('providers.validation.bioTooLong'),
      }),
    [t],
  );
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ProviderFormValues>({
    resolver: zodResolver(schema),
    defaultValues: valuesFor(provider),
  });

  useEffect(() => {
    if (open) {
      reset(valuesFor(provider));
      resetCreate();
      resetUpdate();
    }
  }, [open, provider, reset, resetCreate, resetUpdate]);

  const safeError = (error: unknown) => {
    if (error instanceof ApiError && error.code === 'SERVICE_PROVIDER_MEMBERSHIP_EXISTS')
      return t('providers.membershipExists');
    if (error instanceof ApiError && error.code === 'MEMBERSHIP_NOT_SERVICE_PROVIDER')
      return t('providers.membershipUnavailable');
    if (error instanceof ApiError && error.status === 403) return t('errors.forbidden');
    const message = t('providers.saveFailed');
    return error instanceof ApiError && error.requestId
      ? `${message} ${t('errors.requestId', { id: error.requestId })}`
      : message;
  };

  async function submit(values: ProviderFormValues) {
    const profile = {
      displayName: values.displayName.trim(),
      phone: values.phone.trim() || null,
      jobTitle: values.jobTitle.trim() || null,
      bio: values.bio.trim() || null,
    };
    try {
      if (provider) {
        await update.mutateAsync({ providerId: provider.id, input: profile });
        toast.success(t('providers.updated'));
      } else {
        const created = await create.mutateAsync({ ...profile, membershipId: values.membershipId });
        toast.success(t('providers.created'));
        onCreated?.(created);
      }
      onOpenChange(false);
    } catch (error) {
      setError('root', { type: 'server', message: safeError(error) });
    }
  }

  const pending = mutation.isPending;
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!pending) onOpenChange(value);
      }}
    >
      <DialogContent
        closeLabel={t('common.close')}
        className="max-h-[calc(100vh-2rem)] max-w-2xl overflow-y-auto"
        onCloseAutoFocus={(event) => {
          if (returnFocus) {
            event.preventDefault();
            returnFocus.focus();
          }
        }}
      >
        <DialogTitle className="pe-8 font-display text-xl font-semibold">
          {provider ? t('providers.edit') : t('providers.add')}
        </DialogTitle>
        <DialogDescription className="mt-2 text-sm text-muted-foreground">
          {provider ? t('providers.editDescription') : t('providers.createDescription')}
        </DialogDescription>
        <form className="mt-6 space-y-5" onSubmit={handleSubmit(submit)} noValidate>
          {!provider && (
            <div className="space-y-2">
              <Label htmlFor="provider-membership">{t('providers.membership')} *</Label>
              <select
                id="provider-membership"
                className="min-h-11 w-full rounded-xl border border-input bg-background px-3 text-start text-sm"
                disabled={memberships.isLoading || memberships.isError}
                {...register('membershipId')}
              >
                <option value="">
                  {memberships.isLoading
                    ? t('providers.membershipsLoading')
                    : t('providers.selectMembership')}
                </option>
                {memberships.data?.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.user.firstName} {item.user.lastName} — {item.user.email}
                  </option>
                ))}
              </select>
              {memberships.isError && (
                <p className="text-sm text-destructive">{t('providers.membershipsFailed')}</p>
              )}
              {memberships.data?.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {t('providers.noAvailableMemberships')}
                </p>
              )}
              {errors.membershipId && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.membershipId.message}
                </p>
              )}
            </div>
          )}
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="provider-name">{t('providers.displayName')} *</Label>
              <Input
                id="provider-name"
                maxLength={160}
                dir="auto"
                aria-invalid={Boolean(errors.displayName)}
                {...register('displayName')}
              />
              {errors.displayName && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.displayName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="provider-job">{t('providers.jobTitle')}</Label>
              <Input id="provider-job" maxLength={120} dir="auto" {...register('jobTitle')} />
              {errors.jobTitle && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.jobTitle.message}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="provider-phone">{t('providers.phone')}</Label>
            <Input id="provider-phone" maxLength={50} dir="ltr" {...register('phone')} />
            {errors.phone && (
              <p className="text-sm text-destructive" role="alert">
                {errors.phone.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="provider-bio">{t('providers.biography')}</Label>
            <textarea
              id="provider-bio"
              rows={4}
              maxLength={2000}
              dir="auto"
              className="min-h-24 w-full resize-y rounded-xl border border-input bg-background px-3 py-2 text-start text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
              {...register('bio')}
            />
            {errors.bio && (
              <p className="text-sm text-destructive" role="alert">
                {errors.bio.message}
              </p>
            )}
          </div>
          {errors.root && (
            <p className="text-sm text-destructive" role="alert">
              {errors.root.message}
            </p>
          )}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={pending}>
                {t('common.cancel')}
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={pending || (!provider && memberships.data?.length === 0)}
            >
              {pending && <LoaderCircle className="size-4 animate-spin" />}
              {pending ? t('providers.saving') : t('providers.saveChanges')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
