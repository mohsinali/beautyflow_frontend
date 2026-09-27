'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircle, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
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
import { ApiError } from '@/lib/api/error';
import { useCreateBranch, useUpdateBranch } from '../hooks/use-branches';
import { branchSchema, type BranchFormValues } from '../schemas/branch-schema';
import type { Branch } from '../types/branch';

const fallbackTimezones = [
  'UTC',
  'Asia/Karachi',
  'Asia/Riyadh',
  'Asia/Dubai',
  'Europe/London',
  'America/New_York',
  'America/Toronto',
];

function timezones() {
  const intl = Intl as typeof Intl & { supportedValuesOf?: (key: 'timeZone') => string[] };
  const values = intl.supportedValuesOf?.('timeZone') ?? fallbackTimezones;
  return values.includes('UTC') ? values : ['UTC', ...values];
}

function valuesFor(branch: Branch | null, tenantTimezone: string): BranchFormValues {
  return {
    name: branch?.name ?? '',
    timezone: branch?.timezone ?? tenantTimezone,
    address: branch?.address ?? '',
    phone: branch?.phone ?? '',
  };
}

export function BranchFormDialog({
  tenantId,
  tenantTimezone,
  branch,
  open,
  onOpenChange,
  onSaved,
}: {
  tenantId: string;
  tenantTimezone: string;
  branch: Branch | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => Promise<void>;
}) {
  const t = useTranslations();
  const create = useCreateBranch(tenantId);
  const update = useUpdateBranch(tenantId);
  const resetCreate = create.reset;
  const resetUpdate = update.reset;
  const mutation = branch ? update : create;
  const [timezoneSearch, setTimezoneSearch] = useState('');
  const schema = useMemo(
    () =>
      branchSchema({
        nameRequired: t('branches.validation.nameRequired'),
        nameTooLong: t('branches.validation.nameTooLong'),
        timezoneRequired: t('branches.validation.timezoneRequired'),
        addressTooLong: t('branches.validation.addressTooLong'),
        phoneTooLong: t('branches.validation.phoneTooLong'),
      }),
    [t],
  );
  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    control,
    formState: { errors, isDirty },
  } = useForm<BranchFormValues>({
    resolver: zodResolver(schema),
    defaultValues: valuesFor(branch, tenantTimezone),
  });
  const selectedTimezone = useWatch({ control, name: 'timezone' });
  const timezoneValues = useMemo(() => timezones(), []);
  const matchingTimezones = useMemo(() => {
    const search = timezoneSearch.trim().toLocaleLowerCase();
    if (!search) return [];
    return timezoneValues
      .filter((timezone) => timezone.replaceAll('_', ' ').toLocaleLowerCase().includes(search))
      .slice(0, 12);
  }, [timezoneSearch, timezoneValues]);

  useEffect(() => {
    if (open) {
      reset(valuesFor(branch, tenantTimezone));
      resetCreate();
      resetUpdate();
    }
  }, [branch, open, reset, resetCreate, resetUpdate, tenantTimezone]);

  async function submit(values: BranchFormValues) {
    const input = {
      name: values.name.trim(),
      timezone: values.timezone,
      address: values.address.trim() || null,
      phone: values.phone.trim() || null,
    };
    try {
      if (branch) {
        await update.mutateAsync({ id: branch.id, input });
        await onSaved();
        toast.success(t('branches.updated'));
      } else {
        await create.mutateAsync(input);
        await onSaved();
        toast.success(t('branches.created'));
      }
      setTimezoneSearch('');
      onOpenChange(false);
    } catch (error) {
      let message = t('branches.saveFailed');
      if (error instanceof ApiError) {
        if (error.status === 403) message = t('errors.forbidden');
        else if (error.status === 400) message = t('errors.validation');
        else if (error.code === 'NETWORK_ERROR' || error.code === 'REQUEST_TIMEOUT')
          message = t('errors.network');
        else if (error.requestId) message += ` ${t('errors.requestId', { id: error.requestId })}`;
      }
      setError('root', { type: 'server', message });
    }
  }

  const pending = mutation.isPending;
  const errorClass = 'text-sm text-destructive';
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!pending) {
          if (!value) setTimezoneSearch('');
          onOpenChange(value);
        }
      }}
    >
      <DialogContent
        closeLabel={t('common.close')}
        className="max-h-[calc(100vh-2rem)] max-w-xl overflow-y-auto"
      >
        <DialogTitle className="pe-8 font-display text-xl font-semibold">
          {t(branch ? 'branches.edit' : 'branches.add')}
        </DialogTitle>
        <DialogDescription className="mt-2 text-sm text-muted-foreground">
          {t('branches.formDescription')}
        </DialogDescription>
        <form className="mt-6 space-y-5" onSubmit={handleSubmit(submit)} noValidate>
          <div className="space-y-2">
            <Label htmlFor="branch-name">{t('branches.name')} *</Label>
            <Input
              id="branch-name"
              maxLength={120}
              dir="auto"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'branch-name-error' : undefined}
              {...register('name')}
            />
            {errors.name && (
              <p id="branch-name-error" className={errorClass} role="alert">
                {errors.name.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone-search">{t('branches.timezone')} *</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute start-3 top-[22px] size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="timezone-search"
                type="search"
                className="ps-10"
                value={timezoneSearch}
                onChange={(event) => setTimezoneSearch(event.target.value)}
                placeholder={t('branches.searchTimezones')}
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={Boolean(timezoneSearch.trim())}
                aria-controls="timezone-results"
              />
              {timezoneSearch.trim() && (
                <div
                  id="timezone-results"
                  role="listbox"
                  className="mt-2 max-h-56 w-full overflow-y-auto rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-sm"
                >
                  {matchingTimezones.length ? (
                    matchingTimezones.map((timezone) => (
                      <button
                        key={timezone}
                        type="button"
                        role="option"
                        aria-selected={timezone === selectedTimezone}
                        className="flex min-h-10 w-full items-center rounded-lg px-3 text-start text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                        onClick={() => {
                          setValue('timezone', timezone, {
                            shouldDirty: timezone !== selectedTimezone,
                            shouldValidate: true,
                          });
                          setTimezoneSearch('');
                        }}
                      >
                        {timezone.replaceAll('_', ' ')}
                      </button>
                    ))
                  ) : (
                    <p className="px-3 py-2 text-sm text-muted-foreground">
                      {t('branches.noTimezoneMatches')}
                    </p>
                  )}
                </div>
              )}
            </div>
            {!timezoneSearch.trim() && (
              <select
                aria-label={t('branches.selectTimezone')}
                aria-invalid={Boolean(errors.timezone)}
                aria-describedby={errors.timezone ? 'branch-timezone-error' : undefined}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register('timezone')}
              >
                <option value="">{t('branches.selectTimezone')}</option>
                {timezoneValues.map((timezone) => (
                  <option key={timezone} value={timezone}>
                    {timezone.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
            )}
            {errors.timezone && (
              <p id="branch-timezone-error" className={errorClass} role="alert">
                {errors.timezone.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="branch-address">{t('branches.address')}</Label>
            <textarea
              id="branch-address"
              rows={3}
              maxLength={250}
              dir="auto"
              aria-invalid={Boolean(errors.address)}
              aria-describedby={errors.address ? 'branch-address-error' : undefined}
              className="min-h-20 w-full resize-y rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...register('address')}
            />
            {errors.address && (
              <p id="branch-address-error" className={errorClass} role="alert">
                {errors.address.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="branch-phone">{t('branches.phone')}</Label>
            <Input
              id="branch-phone"
              type="tel"
              dir="ltr"
              maxLength={50}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? 'branch-phone-error' : undefined}
              {...register('phone')}
            />
            {errors.phone && (
              <p id="branch-phone-error" className={errorClass} role="alert">
                {errors.phone.message}
              </p>
            )}
          </div>
          {errors.root && (
            <p className={errorClass} role="alert">
              {errors.root.message}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={pending}>
                {t('common.cancel')}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending || (Boolean(branch) && !isDirty)}>
              {pending && <LoaderCircle className="size-4 animate-spin" />}
              {pending
                ? t('branches.saving')
                : t(branch ? 'branches.saveChanges' : 'branches.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
