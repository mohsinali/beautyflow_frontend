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
import { categorySchema, type CategoryFormValues } from '../schemas/category-schema';
import {
  useCreateServiceCategory,
  useUpdateServiceCategory,
} from '../hooks/use-service-categories';
import type { ServiceCategory } from '../types/service-category';

function valuesFor(category: ServiceCategory | null): CategoryFormValues {
  return {
    name: category?.name ?? '',
    description: category?.description ?? '',
    color: category?.color ?? '',
    iconKey: category?.iconKey ?? '',
    sortOrder: category?.sortOrder ?? 0,
  };
}

export function CategoryFormDialog({
  tenantId,
  open,
  category,
  returnFocus,
  onOpenChange,
}: {
  tenantId: string;
  open: boolean;
  category: ServiceCategory | null;
  returnFocus: HTMLElement | null;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations();
  const createMutation = useCreateServiceCategory(tenantId);
  const updateMutation = useUpdateServiceCategory(tenantId);
  const resetCreateMutation = createMutation.reset;
  const resetUpdateMutation = updateMutation.reset;
  const mutation = category ? updateMutation : createMutation;
  const schema = useMemo(
    () =>
      categorySchema({
        nameRequired: t('categories.validation.nameRequired'),
        nameTooLong: t('categories.validation.nameTooLong'),
        descriptionTooLong: t('categories.validation.descriptionTooLong'),
        colorInvalid: t('categories.validation.colorInvalid'),
        iconKeyInvalid: t('categories.validation.iconKeyInvalid'),
        sortOrderInvalid: t('categories.validation.sortOrderInvalid'),
      }),
    [t],
  );
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(schema),
    defaultValues: valuesFor(category),
  });

  useEffect(() => {
    if (!open) return;
    reset(valuesFor(category));
    resetCreateMutation();
    resetUpdateMutation();
  }, [category, open, reset, resetCreateMutation, resetUpdateMutation]);

  function safeError(error: unknown) {
    if (!(error instanceof ApiError)) return t('categories.saveFailed');
    if (error.code === 'NETWORK_ERROR' || error.code === 'REQUEST_TIMEOUT') {
      return t('errors.network');
    }
    if (error.status === 403) return t('errors.forbidden');
    if (error.code === 'VALIDATION_ERROR') return t('errors.validation');
    if (error.code === 'SERVICE_CATEGORY_NAME_EXISTS') return t('categories.nameExists');
    const fallback = t('categories.saveFailed');
    return error.requestId
      ? `${fallback} ${t('errors.requestId', { id: error.requestId })}`
      : fallback;
  }

  async function submit(values: CategoryFormValues) {
    const normalized = {
      name: values.name.trim(),
      description: values.description.trim(),
      color: values.color.trim(),
      iconKey: values.iconKey.trim(),
      sortOrder: values.sortOrder,
    };
    try {
      if (category) {
        await updateMutation.mutateAsync({
          categoryId: category.id,
          input: {
            name: normalized.name,
            description: normalized.description || null,
            color: normalized.color || null,
            iconKey: normalized.iconKey || null,
            sortOrder: normalized.sortOrder,
          },
        });
        toast.success(t('categories.updated'));
      } else {
        await createMutation.mutateAsync({
          name: normalized.name,
          ...(normalized.description ? { description: normalized.description } : {}),
          ...(normalized.color ? { color: normalized.color } : {}),
          ...(normalized.iconKey ? { iconKey: normalized.iconKey } : {}),
          sortOrder: normalized.sortOrder,
        });
        toast.success(t('categories.created'));
      }
      onOpenChange(false);
    } catch (error) {
      const message = safeError(error);
      if (error instanceof ApiError && error.code === 'SERVICE_CATEGORY_NAME_EXISTS') {
        setError('name', { type: 'server', message }, { shouldFocus: true });
      } else {
        setError('root', { type: 'server', message });
      }
    }
  }

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
        className="max-h-[calc(100vh-2rem)] max-w-xl overflow-y-auto"
        onCloseAutoFocus={(event) => {
          if (returnFocus) {
            event.preventDefault();
            returnFocus.focus();
          }
        }}
      >
        <DialogTitle className="pe-8 font-display text-xl font-semibold">
          {category ? t('categories.edit') : t('categories.add')}
        </DialogTitle>
        <DialogDescription className="mt-2 text-sm leading-6 text-muted-foreground">
          {t('categories.formDescription')}
        </DialogDescription>
        <form className="mt-6 space-y-5" onSubmit={handleSubmit(submit)} noValidate>
          <div className={fieldClass}>
            <Label htmlFor="category-name">
              {t('categories.name')} <span aria-hidden="true">*</span>
            </Label>
            <Input
              id="category-name"
              autoComplete="off"
              maxLength={120}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'category-name-error' : undefined}
              {...register('name')}
            />
            {errors.name && (
              <p id="category-name-error" className={errorClass} role="alert">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className={fieldClass}>
            <Label htmlFor="category-description">{t('categories.descriptionLabel')}</Label>
            <textarea
              id="category-description"
              rows={4}
              maxLength={1000}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={errors.description ? 'category-description-error' : undefined}
              className="min-h-24 w-full resize-y rounded-xl border border-input bg-background px-3 py-2 text-start text-sm text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/35"
              {...register('description')}
            />
            {errors.description && (
              <p id="category-description-error" className={errorClass} role="alert">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className={fieldClass}>
              <Label htmlFor="category-color">{t('categories.color')}</Label>
              <Input
                id="category-color"
                autoComplete="off"
                dir="ltr"
                maxLength={7}
                placeholder="#8D3B66"
                aria-invalid={Boolean(errors.color)}
                aria-describedby="category-color-hint category-color-error"
                {...register('color')}
              />
              <p id="category-color-hint" className="text-xs text-muted-foreground">
                {t('categories.colorHint')}
              </p>
              {errors.color && (
                <p id="category-color-error" className={errorClass} role="alert">
                  {errors.color.message}
                </p>
              )}
            </div>
            <div className={fieldClass}>
              <Label htmlFor="category-icon">{t('categories.iconKey')}</Label>
              <Input
                id="category-icon"
                autoComplete="off"
                dir="ltr"
                maxLength={50}
                aria-invalid={Boolean(errors.iconKey)}
                aria-describedby="category-icon-hint category-icon-error"
                {...register('iconKey')}
              />
              <p id="category-icon-hint" className="text-xs text-muted-foreground">
                {t('categories.iconKeyHint')}
              </p>
              {errors.iconKey && (
                <p id="category-icon-error" className={errorClass} role="alert">
                  {errors.iconKey.message}
                </p>
              )}
            </div>
          </div>

          <div className={`${fieldClass} max-w-48`}>
            <Label htmlFor="category-sort-order">{t('categories.sortOrder')}</Label>
            <Input
              id="category-sort-order"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              aria-invalid={Boolean(errors.sortOrder)}
              aria-describedby={errors.sortOrder ? 'category-sort-order-error' : undefined}
              {...register('sortOrder', { valueAsNumber: true })}
            />
            {errors.sortOrder && (
              <p id="category-sort-order-error" className={errorClass} role="alert">
                {errors.sortOrder.message}
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
            <Button type="submit" disabled={pending || (Boolean(category) && !isDirty)}>
              {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
              {pending ? t('categories.saving') : t('categories.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
