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
import { useServiceCategories } from '@/features/service-categories/hooks/use-service-categories';
import { ApiError } from '@/lib/api/error';
import { serviceSchema, type ServiceFormValues } from '../schemas/service-schema';
import { useCreateCatalogService, useUpdateCatalogService } from '../hooks/use-services';
import type { CatalogService } from '../types/catalog-service';

function valuesFor(service: CatalogService | null): ServiceFormValues {
  return {
    categoryId: service?.categoryId ?? '',
    name: service?.name ?? '',
    description: service?.description ?? '',
    code: service?.code ?? '',
    defaultPrice: service?.defaultPrice ?? '',
    durationMinutes: service?.durationMinutes == null ? '' : String(service.durationMinutes),
    sortOrder: String(service?.sortOrder ?? 0),
  };
}

export function ServiceFormDialog({
  tenantId,
  currencyCode,
  open,
  service,
  returnFocus,
  onOpenChange,
}: {
  tenantId: string;
  currencyCode: string;
  open: boolean;
  service: CatalogService | null;
  returnFocus: HTMLElement | null;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations();
  const createMutation = useCreateCatalogService(tenantId);
  const updateMutation = useUpdateCatalogService(tenantId);
  const resetCreateMutation = createMutation.reset;
  const resetUpdateMutation = updateMutation.reset;
  const mutation = service ? updateMutation : createMutation;
  const categoriesQuery = useServiceCategories(
    tenantId,
    { search: '', isActive: true, page: 1, pageSize: 100 },
    open,
  );
  const schema = useMemo(
    () =>
      serviceSchema({
        categoryRequired: t('services.validation.categoryRequired'),
        nameRequired: t('services.validation.nameRequired'),
        nameTooLong: t('services.validation.nameTooLong'),
        descriptionTooLong: t('services.validation.descriptionTooLong'),
        codeInvalid: t('services.validation.codeInvalid'),
        priceInvalid: t('services.validation.priceInvalid'),
        durationInvalid: t('services.validation.durationInvalid'),
        sortOrderInvalid: t('services.validation.sortOrderInvalid'),
      }),
    [t],
  );
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(schema),
    defaultValues: valuesFor(service),
  });

  useEffect(() => {
    if (!open) return;
    reset(valuesFor(service));
    resetCreateMutation();
    resetUpdateMutation();
  }, [open, reset, resetCreateMutation, resetUpdateMutation, service]);

  function safeError(error: unknown) {
    if (!(error instanceof ApiError)) return t('services.saveFailed');
    if (error.code === 'NETWORK_ERROR' || error.code === 'REQUEST_TIMEOUT') {
      return t('errors.network');
    }
    if (error.status === 403) return t('errors.forbidden');
    if (error.code === 'VALIDATION_ERROR') return t('errors.validation');
    if (error.code === 'CATALOG_SERVICE_NAME_EXISTS') return t('services.nameExists');
    if (error.code === 'CATALOG_SERVICE_CODE_EXISTS') return t('services.codeExists');
    if (error.code === 'SERVICE_CATEGORY_NOT_FOUND') return t('services.categoryUnavailable');
    const fallback = t('services.saveFailed');
    return error.requestId
      ? `${fallback} ${t('errors.requestId', { id: error.requestId })}`
      : fallback;
  }

  async function submit(values: ServiceFormValues) {
    const input = {
      categoryId: values.categoryId,
      name: values.name.trim(),
      description: values.description.trim(),
      code: values.code.trim(),
      defaultPrice: Number(values.defaultPrice),
      durationMinutes: values.durationMinutes ? Number(values.durationMinutes) : null,
      sortOrder: Number(values.sortOrder),
    };
    try {
      if (service) {
        await updateMutation.mutateAsync({
          serviceId: service.id,
          input: {
            ...input,
            description: input.description || null,
            code: input.code || null,
          },
        });
        toast.success(t('services.updated'));
      } else {
        await createMutation.mutateAsync({
          categoryId: input.categoryId,
          name: input.name,
          defaultPrice: input.defaultPrice,
          sortOrder: input.sortOrder,
          ...(input.description ? { description: input.description } : {}),
          ...(input.code ? { code: input.code } : {}),
          ...(input.durationMinutes === null ? {} : { durationMinutes: input.durationMinutes }),
        });
        toast.success(t('services.created'));
      }
      onOpenChange(false);
    } catch (error) {
      const message = safeError(error);
      if (error instanceof ApiError && error.code === 'CATALOG_SERVICE_NAME_EXISTS') {
        setError('name', { type: 'server', message }, { shouldFocus: true });
      } else if (error instanceof ApiError && error.code === 'CATALOG_SERVICE_CODE_EXISTS') {
        setError('code', { type: 'server', message }, { shouldFocus: true });
      } else if (error instanceof ApiError && error.code === 'SERVICE_CATEGORY_NOT_FOUND') {
        setError('categoryId', { type: 'server', message }, { shouldFocus: true });
      } else {
        setError('root', { type: 'server', message });
      }
    }
  }

  const categories = categoriesQuery.data?.items ?? [];
  const currentCategoryMissing = Boolean(
    service && !categories.some((category) => category.id === service.categoryId),
  );
  const categoryDataUnavailable =
    categoriesQuery.isLoading || categoriesQuery.isError || (!service && categories.length === 0);
  const pending = mutation.isPending;
  const fieldClass = 'space-y-2';
  const errorClass = 'text-sm text-destructive';

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!pending) onOpenChange(nextOpen);
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
          {service ? t('services.edit') : t('services.add')}
        </DialogTitle>
        <DialogDescription className="mt-2 text-sm leading-6 text-muted-foreground">
          {t('services.formDescription')}
        </DialogDescription>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit(submit)} noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className={fieldClass}>
              <Label htmlFor="service-name">
                {t('services.name')} <span aria-hidden="true">*</span>
              </Label>
              <Input
                id="service-name"
                autoComplete="off"
                maxLength={160}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? 'service-name-error' : undefined}
                {...register('name')}
              />
              {errors.name && (
                <p id="service-name-error" className={errorClass} role="alert">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className={fieldClass}>
              <Label htmlFor="service-category">
                {t('services.category')} <span aria-hidden="true">*</span>
              </Label>
              <select
                id="service-category"
                disabled={categoriesQuery.isLoading || categoriesQuery.isError}
                aria-invalid={Boolean(errors.categoryId)}
                aria-describedby="service-category-state service-category-error"
                className="min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-start text-sm text-foreground shadow-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/35 disabled:opacity-55"
                {...register('categoryId')}
              >
                <option value="">{t('services.selectCategory')}</option>
                {currentCategoryMissing && service && (
                  <option value={service.categoryId} disabled>
                    {service.category.name} — {t('services.inactive')}
                  </option>
                )}
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <p
                id="service-category-state"
                className="text-xs text-muted-foreground"
                role="status"
              >
                {categoriesQuery.isLoading
                  ? t('services.categoriesLoading')
                  : categoriesQuery.isError
                    ? t('services.categoriesFailed')
                    : categories.length === 0 && !service
                      ? t('services.noActiveCategories')
                      : currentCategoryMissing
                        ? t('services.currentCategoryInactive')
                        : null}
              </p>
              {errors.categoryId && (
                <p id="service-category-error" className={errorClass} role="alert">
                  {errors.categoryId.message}
                </p>
              )}
            </div>
          </div>

          <div className={fieldClass}>
            <Label htmlFor="service-description">{t('services.descriptionLabel')}</Label>
            <textarea
              id="service-description"
              rows={3}
              maxLength={2000}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={errors.description ? 'service-description-error' : undefined}
              className="min-h-24 w-full resize-y rounded-xl border border-input bg-background px-3 py-2 text-start text-sm text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/35"
              {...register('description')}
            />
            {errors.description && (
              <p id="service-description-error" className={errorClass} role="alert">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <div className={fieldClass}>
              <Label htmlFor="service-price">
                {t('services.basePrice')} <span aria-hidden="true">*</span>
              </Label>
              <Input
                id="service-price"
                type="text"
                inputMode="decimal"
                dir="ltr"
                placeholder="0.00"
                aria-invalid={Boolean(errors.defaultPrice)}
                aria-describedby="service-price-hint service-price-error"
                {...register('defaultPrice')}
              />
              <p id="service-price-hint" className="text-xs text-muted-foreground">
                {t('services.priceHint', { currency: currencyCode })}
              </p>
              {errors.defaultPrice && (
                <p id="service-price-error" className={errorClass} role="alert">
                  {errors.defaultPrice.message}
                </p>
              )}
            </div>

            <div className={fieldClass}>
              <Label htmlFor="service-duration">{t('services.durationMinutes')}</Label>
              <Input
                id="service-duration"
                type="number"
                min={1}
                max={10080}
                step={1}
                inputMode="numeric"
                aria-invalid={Boolean(errors.durationMinutes)}
                aria-describedby={errors.durationMinutes ? 'service-duration-error' : undefined}
                {...register('durationMinutes')}
              />
              {errors.durationMinutes && (
                <p id="service-duration-error" className={errorClass} role="alert">
                  {errors.durationMinutes.message}
                </p>
              )}
            </div>

            <div className={fieldClass}>
              <Label htmlFor="service-order">{t('services.sortOrder')}</Label>
              <Input
                id="service-order"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                aria-invalid={Boolean(errors.sortOrder)}
                aria-describedby={errors.sortOrder ? 'service-order-error' : undefined}
                {...register('sortOrder')}
              />
              {errors.sortOrder && (
                <p id="service-order-error" className={errorClass} role="alert">
                  {errors.sortOrder.message}
                </p>
              )}
            </div>
          </div>

          <div className={`${fieldClass} sm:max-w-xs`}>
            <Label htmlFor="service-code">{t('services.code')}</Label>
            <Input
              id="service-code"
              autoComplete="off"
              maxLength={50}
              dir="auto"
              aria-invalid={Boolean(errors.code)}
              aria-describedby="service-code-hint service-code-error"
              {...register('code')}
            />
            <p id="service-code-hint" className="text-xs text-muted-foreground">
              {t('services.codeHint')}
            </p>
            {errors.code && (
              <p id="service-code-error" className={errorClass} role="alert">
                {errors.code.message}
              </p>
            )}
          </div>

          <div aria-live="polite" aria-atomic="true">
            {errors.root?.message && (
              <p className={errorClass} role="alert">
                {errors.root.message}
              </p>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={pending}>
                {t('common.cancel')}
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={pending || categoryDataUnavailable || (Boolean(service) && !isDirty)}
            >
              {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
              {pending
                ? t('services.saving')
                : service
                  ? t('services.saveChanges')
                  : t('services.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
