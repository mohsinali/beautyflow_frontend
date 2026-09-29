'use client';

import Link from 'next/link';
import { ArrowLeft, Clock3, LoaderCircle, Pencil, Search, Scissors } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ErrorState } from '@/components/feedback/error-state';
import { Input } from '@/components/ui/input';
import { ProviderAvatar } from '@/features/service-providers/components/provider-avatar';
import { useServiceProvidersForAssignment } from '@/features/service-providers/hooks/use-service-providers';
import { ApiError } from '@/lib/api/error';
import { permissions } from '@/lib/permissions/permissions';
import { cn } from '@/lib/utils';
import { usePermissions, useSession } from '@/providers/session-provider';
import { useCatalogService, useReplaceServiceProviders } from '../hooks/use-services';
import { ServiceFormDialog } from './service-form-dialog';

type ProviderFilter = 'all' | 'assigned' | 'unassigned';

export function ServiceDetail({ serviceId }: { serviceId: string }) {
  const t = useTranslations();
  const locale = useLocale();
  const { session } = useSession();
  const { can } = usePermissions();
  const tenantId = session?.tenant?.id ?? '';
  const currencyCode = session?.tenant?.currencyCode ?? 'PKR';
  const canView = can(permissions.catalogRead);
  const canViewProviders = can(permissions.providerRead);
  const canManage = can(permissions.providerManageQualifications);
  const canEdit = can(permissions.catalogUpdate);
  const serviceQuery = useCatalogService(tenantId, serviceId, canView);
  const providersQuery = useServiceProvidersForAssignment(
    tenantId,
    canManage,
    canView && canViewProviders,
  );
  const saveMutation = useReplaceServiceProviders(tenantId, serviceId);
  const [changes, setChanges] = useState<Map<string, boolean>>(new Map());
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ProviderFilter>('all');
  const [editOpen, setEditOpen] = useState(false);
  const [editTrigger, setEditTrigger] = useState<HTMLElement | null>(null);

  const saved = useMemo(
    () =>
      new Set(
        (providersQuery.data ?? [])
          .filter((provider) => provider.qualifications.some((item) => item.id === serviceId))
          .map((provider) => provider.id),
      ),
    [providersQuery.data, serviceId],
  );
  const selected = useMemo(() => {
    const result = new Set(saved);
    changes.forEach((checked, providerId) => {
      if (checked) result.add(providerId);
      else result.delete(providerId);
    });
    return result;
  }, [changes, saved]);
  const dirty = changes.size > 0;
  const visibleProviders = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase(locale);
    return (providersQuery.data ?? []).filter((provider) => {
      const assigned = selected.has(provider.id);
      return (
        (!needle || provider.displayName.toLocaleLowerCase(locale).includes(needle)) &&
        (filter === 'all' || (filter === 'assigned' ? assigned : !assigned))
      );
    });
  }, [filter, locale, providersQuery.data, search, selected]);
  const priceFormatter = useMemo(
    () => new Intl.NumberFormat(locale, { style: 'currency', currency: currencyCode }),
    [currencyCode, locale],
  );

  if (!canView || !tenantId) {
    return (
      <Card role="alert">
        <CardContent className="pt-6">
          <h1 className="text-lg font-semibold">{t('unauthorized.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('unauthorized.description')}</p>
        </CardContent>
      </Card>
    );
  }
  if (serviceQuery.isLoading)
    return (
      <Card role="status" aria-live="polite">
        <CardContent className="py-14 text-center">
          <LoaderCircle className="mx-auto size-7 animate-spin text-secondary" />
          <p className="mt-3 text-sm text-muted-foreground">{t('services.detailLoading')}</p>
        </CardContent>
      </Card>
    );
  if (serviceQuery.isError) {
    const missing = serviceQuery.error instanceof ApiError && serviceQuery.error.status === 404;
    return (
      <ErrorState
        error={serviceQuery.error}
        title={missing ? t('services.notFound') : t('services.detailLoadFailed')}
        description={missing ? t('services.notFoundDescription') : undefined}
        onRetry={missing ? undefined : () => void serviceQuery.refetch()}
      />
    );
  }
  const service = serviceQuery.data;
  if (!service) return null;

  async function save() {
    try {
      await saveMutation.mutateAsync([...selected]);
      setChanges(new Map());
      toast.success(t('services.providersSaved'));
    } catch {
      toast.error(t('services.providersSaveFailed'));
      void providersQuery.refetch();
    }
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" className="-ms-3">
        <Link href="/dashboard/catalog/services">
          <ArrowLeft className="size-4 rtl:rotate-180" />
          {t('services.backToServices')}
        </Link>
      </Button>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-secondary">{t('services.serviceDetails')}</p>
          <h1 className="mt-1 break-words font-display text-3xl font-semibold" dir="auto">
            {service.name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span dir="auto">{service.category.name}</span>
            <span
              className={cn(
                'rounded-full px-2.5 py-1 text-xs font-semibold',
                service.isActive ? 'bg-success/12 text-success' : 'bg-muted text-muted-foreground',
              )}
            >
              {service.isActive ? t('services.active') : t('services.inactive')}
            </span>
            <span className="font-medium text-foreground">
              {priceFormatter.format(Number(service.defaultPrice))}
            </span>
            {service.durationMinutes != null && (
              <span className="flex items-center gap-1.5">
                <Clock3 className="size-4" />
                {t('services.durationValue', { count: service.durationMinutes })}
              </span>
            )}
          </div>
        </div>
        {canEdit && (
          <Button
            type="button"
            variant="outline"
            onClick={(event) => {
              setEditTrigger(event.currentTarget);
              setEditOpen(true);
            }}
          >
            <Pencil className="size-4" />
            {t('services.edit')}
          </Button>
        )}
      </header>

      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold">{t('services.information')}</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Detail label={t('services.category')} value={service.category.name} />
            <Detail
              label={t('services.basePrice')}
              value={priceFormatter.format(Number(service.defaultPrice))}
            />
            <Detail
              label={t('services.duration')}
              value={
                service.durationMinutes == null
                  ? t('services.notSet')
                  : t('services.durationValue', { count: service.durationMinutes })
              }
            />
            <Detail label={t('services.code')} value={service.code || t('services.notSet')} />
            <Detail label={t('services.sortOrder')} value={String(service.sortOrder)} />
            {service.description && (
              <Detail label={t('services.descriptionLabel')} value={service.description} wide />
            )}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-5 pt-6">
          <div>
            <h2 className="text-lg font-semibold">{t('services.serviceProviders')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('services.providersDescription')}
            </p>
            {!service.isActive && canManage && (
              <p className="mt-2 text-sm text-amber-700">{t('services.inactiveAssignmentHint')}</p>
            )}
          </div>
          {canViewProviders ? (
            <>
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
                <div>
                  <label htmlFor="provider-search" className="sr-only">
                    {t('services.searchProviders')}
                  </label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="provider-search"
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder={t('services.searchProviders')}
                      className="ps-10"
                    />
                  </div>
                </div>
                <select
                  aria-label={t('services.providerFilter')}
                  value={filter}
                  onChange={(event) => setFilter(event.target.value as ProviderFilter)}
                  className="min-h-11 rounded-xl border border-input bg-background px-3 text-start text-sm"
                >
                  <option value="all">{t('services.allProviders')}</option>
                  <option value="assigned">{t('services.assigned')}</option>
                  <option value="unassigned">{t('services.unassigned')}</option>
                </select>
              </div>

              {providersQuery.isLoading ? (
                <p
                  className="flex items-center gap-2 py-6 text-sm text-muted-foreground"
                  role="status"
                >
                  <LoaderCircle className="size-4 animate-spin" />
                  {t('services.providersLoading')}
                </p>
              ) : providersQuery.isError ? (
                <ErrorState
                  error={providersQuery.error}
                  title={t('services.providersLoadFailed')}
                  onRetry={() => void providersQuery.refetch()}
                />
              ) : (providersQuery.data?.length ?? 0) === 0 ? (
                <div className="py-8 text-center">
                  <Scissors className="mx-auto size-7 text-secondary" />
                  <h3 className="mt-3 font-semibold">{t('services.noProviders')}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t('services.noProvidersDescription')}
                  </p>
                </div>
              ) : visibleProviders.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {t('services.noProviderMatches')}
                </p>
              ) : (
                <div className="divide-y divide-border rounded-xl border border-border">
                  {visibleProviders.map((provider) => {
                    const checked = selected.has(provider.id);
                    return (
                      <label
                        key={provider.id}
                        className={cn(
                          'flex cursor-pointer items-start gap-3 p-4 hover:bg-muted/35',
                          !canManage && 'cursor-default',
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!canManage || (!service.isActive && !saved.has(provider.id))}
                          aria-label={t('services.providerAssignmentLabel', {
                            provider: provider.displayName,
                          })}
                          onChange={(event) =>
                            setChanges((current) => {
                              const next = new Map(current);
                              if (event.target.checked === saved.has(provider.id))
                                next.delete(provider.id);
                              else next.set(provider.id, event.target.checked);
                              return next;
                            })
                          }
                          className="mt-3 size-5 accent-primary"
                        />
                        <ProviderAvatar name={provider.displayName} photoUrl={provider.photoUrl} />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold" dir="auto">
                              {provider.displayName}
                            </span>
                            {!provider.effectivelyActive && (
                              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                {t('services.inactive')}
                              </span>
                            )}
                          </span>
                          {provider.jobTitle && (
                            <span className="mt-0.5 block text-sm text-muted-foreground" dir="auto">
                              {provider.jobTitle}
                            </span>
                          )}
                          <span className="mt-1 block text-xs text-muted-foreground" dir="auto">
                            {provider.assignedBranches.length
                              ? provider.assignedBranches.map((branch) => branch.name).join(', ')
                              : t('services.noBranches')}
                          </span>
                        </span>
                        <span className="mt-3 hidden text-xs font-medium text-muted-foreground sm:block">
                          {checked ? t('services.assigned') : t('services.unassigned')}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
              {canManage && (
                <div className="sticky bottom-3 flex justify-end rounded-xl border border-border bg-background/95 p-3 shadow-sm backdrop-blur">
                  <Button
                    type="button"
                    disabled={!dirty || saveMutation.isPending || !serviceQuery.data}
                    onClick={() => void save()}
                  >
                    {saveMutation.isPending && <LoaderCircle className="size-4 animate-spin" />}
                    {t('services.saveProviderAssignments')}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{t('services.providersUnavailable')}</p>
          )}
        </CardContent>
      </Card>

      {canEdit && (
        <ServiceFormDialog
          tenantId={tenantId}
          currencyCode={currencyCode}
          open={editOpen}
          service={service}
          returnFocus={editTrigger}
          onOpenChange={setEditOpen}
        />
      )}
    </div>
  );
}

function Detail({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? 'sm:col-span-2 lg:col-span-3' : undefined}>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap text-sm font-medium" dir="auto">
        {value}
      </dd>
    </div>
  );
}
