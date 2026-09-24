'use client';

import {
  ChevronLeft,
  ChevronRight,
  CircleOff,
  LoaderCircle,
  MapPin,
  Search,
  Settings2,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ErrorState } from '@/components/feedback/error-state';
import { Input } from '@/components/ui/input';
import { useServiceCategories } from '@/features/service-categories/hooks/use-service-categories';
import { ApiError } from '@/lib/api/error';
import { permissions } from '@/lib/permissions/permissions';
import { cn } from '@/lib/utils';
import { useActiveBranch, usePermissions, useSession } from '@/providers/session-provider';
import { ConfigureBranchServiceDialog } from './configure-branch-service-dialog';
import { useBranchServices } from '../hooks/use-branch-services';
import type { BranchService, BranchServiceAvailability } from '../types/branch-service';

const PAGE_SIZE = 20;

function AvailabilityBadge({ enabled }: { enabled: boolean }) {
  const t = useTranslations('branchServices');
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        enabled ? 'bg-success/12 text-success' : 'bg-muted text-muted-foreground',
      )}
    >
      <span
        className={cn('size-1.5 rounded-full', enabled ? 'bg-success' : 'bg-muted-foreground')}
        aria-hidden="true"
      />
      {enabled ? t('enabled') : t('disabled')}
    </span>
  );
}

function LoadingState() {
  const t = useTranslations('branchServices');
  return (
    <Card role="status" aria-live="polite">
      <CardContent className="py-12 text-center sm:py-14">
        <LoaderCircle className="mx-auto size-7 animate-spin text-secondary" aria-hidden="true" />
        <p className="mt-3 text-sm text-muted-foreground">{t('loading')}</p>
      </CardContent>
    </Card>
  );
}

function EmptyState({ filtered, onClear }: { filtered: boolean; onClear: () => void }) {
  const t = useTranslations('branchServices');
  return (
    <Card>
      <CardContent className="py-12 text-center sm:py-14">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-muted text-secondary">
          {filtered ? <Search className="size-6" /> : <SlidersHorizontal className="size-6" />}
        </span>
        <h2 className="mt-4 font-semibold">{filtered ? t('noMatches') : t('empty')}</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          {filtered ? t('noMatchesDescription') : t('emptyDescription')}
        </p>
        {filtered && (
          <Button className="mt-4" type="button" variant="outline" onClick={onClear}>
            {t('clearFilters')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function BranchServicesList() {
  const t = useTranslations();
  const locale = useLocale();
  const { session, isLoading: sessionLoading } = useSession();
  const { activeBranch } = useActiveBranch();
  const { can } = usePermissions();
  const tenantId = session?.tenant?.id ?? '';
  const currencyCode = session?.tenant?.currencyCode ?? 'PKR';
  const canView = can(permissions.catalogRead);
  const canConfigure = can(permissions.catalogConfigureBranch);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [availability, setAvailability] = useState<BranchServiceAvailability>('all');
  const [pagination, setPagination] = useState({ branchId: '', page: 1 });
  const [configuring, setConfiguring] = useState<{
    branchId: string;
    service: BranchService;
  } | null>(null);
  const [dialogTrigger, setDialogTrigger] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPagination({ branchId: activeBranch?.id ?? '', page: 1 });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [activeBranch?.id, searchInput]);

  const page = pagination.branchId === (activeBranch?.id ?? '') ? pagination.page : 1;

  const params = {
    search,
    categoryId,
    availability,
    includeInactive: canConfigure,
    page,
    pageSize: PAGE_SIZE,
  };
  const query = useBranchServices(
    tenantId,
    activeBranch?.id ?? '',
    params,
    canView && Boolean(activeBranch),
  );
  const activeCategoriesQuery = useServiceCategories(
    tenantId,
    { search: '', isActive: true, page: 1, pageSize: 100 },
    canView && Boolean(activeBranch),
  );
  const inactiveCategoriesQuery = useServiceCategories(
    tenantId,
    { search: '', isActive: false, page: 1, pageSize: 100 },
    canView && canConfigure && Boolean(activeBranch),
  );
  const categories = useMemo(() => {
    const values = [
      ...(activeCategoriesQuery.data?.items ?? []),
      ...(inactiveCategoriesQuery.data?.items ?? []),
    ];
    return [...new Map(values.map((category) => [category.id, category])).values()];
  }, [activeCategoriesQuery.data?.items, inactiveCategoriesQuery.data?.items]);
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

  const meta = query.data?.meta;

  if (sessionLoading) return <LoadingState />;
  if (!canView || !tenantId) {
    return (
      <Card role="alert">
        <CardContent className="flex items-start gap-4 pt-5 sm:pt-6">
          <CircleOff className="size-6 shrink-0 text-destructive" aria-hidden="true" />
          <div>
            <h1 className="text-lg font-semibold">{t('unauthorized.title')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('unauthorized.description')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  function clearFilters() {
    setSearchInput('');
    setCategoryId('');
    setAvailability('all');
    setPagination({ branchId: activeBranch?.id ?? '', page: 1 });
  }

  function openConfigure(service: BranchService, element: HTMLElement) {
    setDialogTrigger(element);
    if (activeBranch) setConfiguring({ branchId: activeBranch.id, service });
  }

  const items = query.data?.items ?? [];
  const filtered = Boolean(search || categoryId || availability !== 'all');

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-secondary">{t('branchServices.catalog')}</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
          {t('branchServices.title')}
        </h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">{t('branchServices.description')}</p>
      </header>

      {!activeBranch ? (
        <Card>
          <CardContent className="py-12 text-center sm:py-14">
            <MapPin className="mx-auto size-8 text-secondary" aria-hidden="true" />
            <h2 className="mt-4 font-semibold">{t('branchServices.selectBranch')}</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              {t('branchServices.selectBranchDescription')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="pt-5 sm:pt-6">
              <div className="mb-5 flex items-center gap-3 rounded-xl bg-muted/55 p-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-card text-secondary shadow-sm">
                  <MapPin className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">
                    {t('branchServices.activeBranch')}
                  </p>
                  <p className="truncate font-semibold" dir="auto">
                    {activeBranch.name}
                  </p>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(12rem,0.45fr)_12rem] md:items-end">
                <div className="min-w-0">
                  <label htmlFor="branch-service-search" className="sr-only">
                    {t('branchServices.search')}
                  </label>
                  <div className="relative">
                    <Search
                      className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      id="branch-service-search"
                      type="search"
                      value={searchInput}
                      onChange={(event) => setSearchInput(event.target.value)}
                      placeholder={t('branchServices.search')}
                      className="ps-10 pe-11"
                    />
                    {searchInput && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="absolute end-0 top-0"
                        aria-label={t('branchServices.clearSearch')}
                        onClick={() => setSearchInput('')}
                      >
                        <X className="size-4" aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                </div>
                <div>
                  <label htmlFor="branch-service-category" className="sr-only">
                    {t('branchServices.filterCategory')}
                  </label>
                  <select
                    id="branch-service-category"
                    value={categoryId}
                    disabled={activeCategoriesQuery.isLoading || activeCategoriesQuery.isError}
                    onChange={(event) => {
                      setCategoryId(event.target.value);
                      setPagination({ branchId: activeBranch.id, page: 1 });
                    }}
                    className="min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-start text-sm text-foreground shadow-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/35 disabled:opacity-55"
                  >
                    <option value="">{t('branchServices.allCategories')}</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                        {!category.isActive ? ` — ${t('branchServices.tenantInactive')}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="branch-service-availability" className="sr-only">
                    {t('branchServices.filterAvailability')}
                  </label>
                  <select
                    id="branch-service-availability"
                    value={availability}
                    onChange={(event) => {
                      setAvailability(event.target.value as BranchServiceAvailability);
                      setPagination({ branchId: activeBranch.id, page: 1 });
                    }}
                    className="min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-start text-sm text-foreground shadow-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/35"
                  >
                    <option value="all">{t('branchServices.allServices')}</option>
                    <option value="enabled">{t('branchServices.enabled')}</option>
                    <option value="disabled">{t('branchServices.disabled')}</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex min-h-5 flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                {meta ? <p>{t('branchServices.count', { count: meta.total })}</p> : <span />}
                <div className="flex items-center gap-3">
                  {filtered && (
                    <Button type="button" size="sm" variant="ghost" onClick={clearFilters}>
                      {t('branchServices.clearFilters')}
                    </Button>
                  )}
                  {query.isFetching && !query.isLoading && (
                    <p className="flex items-center gap-2" role="status">
                      <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                      {t('branchServices.refreshing')}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {query.isLoading ? (
            <LoadingState />
          ) : query.isError ? (
            <ErrorState
              error={query.error}
              title={t('branchServices.loadFailed')}
              description={
                query.error instanceof ApiError && query.error.status === 403
                  ? t('errors.forbidden')
                  : undefined
              }
              onRetry={() => void query.refetch()}
            />
          ) : items.length === 0 ? (
            <EmptyState filtered={filtered} onClear={clearFilters} />
          ) : (
            <>
              <div className="grid gap-3 md:hidden">
                {items.map((service) => {
                  const tenantInactive = !service.isActive || !service.category.isActive;
                  return (
                    <Card key={service.id}>
                      <CardContent className="space-y-4 pt-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold" dir="auto">
                              {service.name}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground" dir="auto">
                              {service.category.name}
                            </p>
                          </div>
                          <AvailabilityBadge enabled={service.effectiveAvailability} />
                        </div>
                        {tenantInactive && (
                          <div className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm">
                            <p className="font-semibold">{t('branchServices.tenantInactive')}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {t('branchServices.tenantInactiveExplanation')}
                            </p>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted/55 p-3 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              {t('branchServices.basePrice')}
                            </p>
                            <p className="mt-1 font-semibold tabular-nums" dir="auto">
                              {priceFormatter.format(Number(service.defaultPrice))}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              {t('branchServices.branchPrice')}
                            </p>
                            <p className="mt-1 font-semibold tabular-nums" dir="auto">
                              {service.priceOverride === null
                                ? t('branchServices.usesBasePrice')
                                : priceFormatter.format(Number(service.priceOverride))}
                            </p>
                          </div>
                          <div className="col-span-2 border-t border-border pt-3">
                            <p className="text-xs text-muted-foreground">
                              {t('branchServices.effectivePrice')}
                            </p>
                            <p className="mt-1 font-semibold tabular-nums" dir="auto">
                              {priceFormatter.format(Number(service.effectivePrice))}
                            </p>
                          </div>
                        </div>
                        {canConfigure && (
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            disabled={tenantInactive}
                            title={
                              tenantInactive
                                ? t('branchServices.tenantInactiveExplanation')
                                : undefined
                            }
                            onClick={(event) => openConfigure(service, event.currentTarget)}
                          >
                            <Settings2 className="size-4" aria-hidden="true" />
                            {t('branchServices.configureService')}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Card className="hidden overflow-hidden md:block">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] border-collapse text-start text-sm">
                    <thead className="bg-muted/70 text-muted-foreground">
                      <tr>
                        <th scope="col" className="px-5 py-3 text-start font-medium">
                          {t('branchServices.service')}
                        </th>
                        <th scope="col" className="px-5 py-3 text-start font-medium">
                          {t('branchServices.category')}
                        </th>
                        <th scope="col" className="px-5 py-3 text-start font-medium">
                          {t('branchServices.basePrice')}
                        </th>
                        <th scope="col" className="px-5 py-3 text-start font-medium">
                          {t('branchServices.branchPrice')}
                        </th>
                        <th scope="col" className="px-5 py-3 text-start font-medium">
                          {t('branchServices.effectivePrice')}
                        </th>
                        <th scope="col" className="px-5 py-3 text-start font-medium">
                          {t('branchServices.availability')}
                        </th>
                        {canConfigure && (
                          <th scope="col" className="px-5 py-3 text-end font-medium">
                            {t('branchServices.actions')}
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {items.map((service) => {
                        const tenantInactive = !service.isActive || !service.category.isActive;
                        return (
                          <tr key={service.id} className="align-middle hover:bg-muted/25">
                            <td className="px-5 py-4">
                              <p className="font-semibold" dir="auto">
                                {service.name}
                              </p>
                              {tenantInactive && (
                                <p className="mt-1 text-xs font-medium text-warning">
                                  {t('branchServices.tenantInactive')}
                                </p>
                              )}
                            </td>
                            <td className="px-5 py-4" dir="auto">
                              {service.category.name}
                            </td>
                            <td className="px-5 py-4 font-medium tabular-nums" dir="auto">
                              {priceFormatter.format(Number(service.defaultPrice))}
                            </td>
                            <td className="px-5 py-4 font-medium tabular-nums" dir="auto">
                              {service.priceOverride === null
                                ? t('branchServices.usesBasePrice')
                                : priceFormatter.format(Number(service.priceOverride))}
                            </td>
                            <td className="px-5 py-4 font-semibold tabular-nums" dir="auto">
                              {priceFormatter.format(Number(service.effectivePrice))}
                            </td>
                            <td className="px-5 py-4">
                              <AvailabilityBadge enabled={service.effectiveAvailability} />
                            </td>
                            {canConfigure && (
                              <td className="px-5 py-4 text-end">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={tenantInactive}
                                  title={
                                    tenantInactive
                                      ? t('branchServices.tenantInactiveExplanation')
                                      : undefined
                                  }
                                  onClick={(event) => openConfigure(service, event.currentTarget)}
                                >
                                  <Settings2 className="size-4" aria-hidden="true" />
                                  {t('branchServices.configureService')}
                                </Button>
                                {tenantInactive && (
                                  <p className="mt-1 max-w-52 text-xs text-muted-foreground">
                                    {t('branchServices.tenantInactiveExplanation')}
                                  </p>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}

          {meta && meta.pageCount > 1 && (
            <nav
              className="flex items-center justify-between gap-4"
              aria-label={t('branchServices.pages')}
            >
              <Button
                type="button"
                variant="outline"
                disabled={page <= 1 || query.isFetching}
                onClick={() =>
                  setPagination({
                    branchId: activeBranch.id,
                    page: Math.max(1, (meta?.page ?? page) - 1),
                  })
                }
              >
                <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
                {t('branchServices.previous')}
              </Button>
              <p className="text-sm text-muted-foreground">
                {t('branchServices.page', { page: meta.page, total: meta.pageCount })}
              </p>
              <Button
                type="button"
                variant="outline"
                disabled={page >= meta.pageCount || query.isFetching}
                onClick={() =>
                  setPagination({ branchId: activeBranch.id, page: (meta?.page ?? page) + 1 })
                }
              >
                {t('branchServices.next')}
                <ChevronRight className="size-4 rtl:rotate-180" aria-hidden="true" />
              </Button>
            </nav>
          )}

          {canConfigure && configuring?.branchId === activeBranch.id && (
            <ConfigureBranchServiceDialog
              tenantId={tenantId}
              branch={activeBranch}
              currencyCode={currencyCode}
              service={configuring.service}
              returnFocus={dialogTrigger}
              onOpenChange={(open) => {
                if (!open) setConfiguring(null);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
