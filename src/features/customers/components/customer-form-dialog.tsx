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
import type { BranchSummary } from '@/types/session';
import { useCreateCustomer, useUpdateCustomer } from '../hooks/use-customers';
import { customerSchema, type CustomerFormValues } from '../schemas/customer-schema';
import type { Customer } from '../types/customer';

function valuesFor(customer: Customer | null, defaultBranchId: string): CustomerFormValues {
  return {
    name: customer?.name ?? '',
    phone: customer?.phone ?? '',
    preferredBranchId: customer?.preferredBranch?.id ?? defaultBranchId,
    notes: customer?.notes ?? '',
  };
}

export function CustomerFormDialog({
  tenantId,
  open,
  customer,
  branches,
  defaultBranchId,
  onOpenChange,
}: {
  tenantId: string;
  open: boolean;
  customer: Customer | null;
  branches: BranchSummary[];
  defaultBranchId: string;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations();
  const create = useCreateCustomer(tenantId);
  const update = useUpdateCustomer(tenantId);
  const resetCreate = create.reset;
  const resetUpdate = update.reset;
  const mutation = customer ? update : create;
  const schema = useMemo(
    () =>
      customerSchema({
        nameRequired: t('customers.validation.nameRequired'),
        nameTooLong: t('customers.validation.nameTooLong'),
        phoneInvalid: t('customers.validation.phoneInvalid'),
        notesTooLong: t('customers.validation.notesTooLong'),
      }),
    [t],
  );
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(schema),
    defaultValues: valuesFor(customer, defaultBranchId),
  });
  useEffect(() => {
    if (open) {
      reset(valuesFor(customer, defaultBranchId));
      resetCreate();
      resetUpdate();
    }
  }, [open, customer, defaultBranchId, reset, resetCreate, resetUpdate]);

  async function submit(values: CustomerFormValues) {
    const input = {
      name: values.name.trim(),
      phone: values.phone.trim() || null,
      preferredBranchId: values.preferredBranchId || null,
      notes: values.notes.trim() || null,
    };
    try {
      if (customer) {
        await update.mutateAsync({ id: customer.id, input });
        toast.success(t('customers.updated'));
      } else {
        await create.mutateAsync(input);
        toast.success(t('customers.created'));
      }
      onOpenChange(false);
    } catch (error) {
      let message = t('customers.saveFailed');
      if (error instanceof ApiError) {
        if (error.code === 'CUSTOMER_PHONE_EXISTS') message = t('customers.phoneExists');
        else if (error.status === 403) message = t('errors.forbidden');
        else if (error.code === 'NETWORK_ERROR' || error.code === 'REQUEST_TIMEOUT')
          message = t('errors.network');
        else if (error.requestId) message += ` ${t('errors.requestId', { id: error.requestId })}`;
      }
      if (error instanceof ApiError && error.code === 'CUSTOMER_PHONE_EXISTS')
        setError('phone', { type: 'server', message }, { shouldFocus: true });
      else setError('root', { type: 'server', message });
    }
  }
  const pending = mutation.isPending;
  const errorClass = 'text-sm text-destructive';
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!pending) onOpenChange(value);
      }}
    >
      <DialogContent
        closeLabel={t('common.close')}
        className="max-h-[calc(100vh-2rem)] max-w-xl overflow-y-auto"
      >
        <DialogTitle className="pe-8 font-display text-xl font-semibold">
          {customer ? t('customers.edit') : t('customers.add')}
        </DialogTitle>
        <DialogDescription className="mt-2 text-sm text-muted-foreground">
          {t('customers.formDescription')}
        </DialogDescription>
        <form className="mt-6 space-y-5" onSubmit={handleSubmit(submit)} noValidate>
          <div className="space-y-2">
            <Label htmlFor="customer-name">{t('customers.name')} *</Label>
            <Input
              id="customer-name"
              maxLength={160}
              dir="auto"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'customer-name-error' : undefined}
              {...register('name')}
            />
            {errors.name && (
              <p id="customer-name-error" className={errorClass} role="alert">
                {errors.name.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer-phone">{t('customers.phone')}</Label>
            <Input
              id="customer-phone"
              type="tel"
              dir="ltr"
              maxLength={50}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? 'customer-phone-error' : undefined}
              {...register('phone')}
            />
            {errors.phone && (
              <p id="customer-phone-error" className={errorClass} role="alert">
                {errors.phone.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer-branch">{t('customers.preferredBranch')}</Label>
            <select
              id="customer-branch"
              className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...register('preferredBranchId')}
            >
              <option value="">{t('customers.noPreferredBranch')}</option>
              {customer?.preferredBranch &&
                !branches.some((branch) => branch.id === customer.preferredBranch?.id) && (
                  <option value={customer.preferredBranch.id}>
                    {customer.preferredBranch.name}
                  </option>
                )}
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer-notes">{t('customers.notes')}</Label>
            <textarea
              id="customer-notes"
              rows={4}
              maxLength={2000}
              dir="auto"
              className="min-h-24 w-full resize-y rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-invalid={Boolean(errors.notes)}
              aria-describedby={errors.notes ? 'customer-notes-error' : undefined}
              {...register('notes')}
            />
            {errors.notes && (
              <p id="customer-notes-error" className={errorClass} role="alert">
                {errors.notes.message}
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
            <Button type="submit" disabled={pending || (Boolean(customer) && !isDirty)}>
              {pending && <LoaderCircle className="size-4 animate-spin" />}
              {pending
                ? t('customers.saving')
                : customer
                  ? t('customers.saveChanges')
                  : t('customers.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
