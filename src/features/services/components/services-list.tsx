'use client';

import {
  ChevronLeft,
  ChevronRight,
  CircleOff,
  Clock3,
  LoaderCircle,
  Pencil,
  Plus,
  RotateCcw,
  Scissors,
  Search,
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
import { usePermissions, useSession } from '@/providers/session-provider';
import { ServiceFormDialog } from './service-form-dialog';
import { ServiceStatusDialog } from './service-status-dialog';
import { useCatalogServices } from '../hooks/use-services';
import type { CatalogService } from '../types/catalog-service';

const PAGE_SIZE = 20;

function StatusBadge({ active }: { active: boolean }) {
  const t = useTranslations('services');
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        active ? 'bg-success/12 text-success' : 'bg-muted text-muted-foreground',
      )}
    >
      <span
        className={cn('size-1.5 rounded-full', active ? 'bg-success' : 'bg-muted-foreground')}
        aria-hidden="true"
      />
      {active ? t('active') : t('inactive')}
    </span>
  );
}

function ServiceIdentity({ service }: { service: CatalogService }) {
  const t = useTranslations('services');
  return (
    <div className="min-w-0">
      <p className="font-semibold" dir="auto">
        {service.name}
      </p>
      <p className="mt-1 truncate text-xs text-muted-foreground" dir="auto">
        {service.code || t('noCode')}
      </p>
    </div>
  );
}

function ServiceActions({
  service,
  canEdit,
  canChangeStatus,
  onEdit,
  onStatus,
}: {
  service: CatalogService;
  canEdit: boolean;
  canChangeStatus: boolean;
  onEdit: (element: HTMLButtonElement) => void;
  onStatus: (element: HTMLButtonElement) => void;
}) {
  const t = useTranslations('services');
  return (
    <div className="flex flex-wrap justify-end gap-2">
      {canEdit && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={(event) => onEdit(event.currentTarget)}
        >
          <Pencil className="size-4" aria-hidden="true" />
          {t('edit')}
        </Button>
      )}
      {canChangeStatus && (
        <Button
          type="button"
          size="sm"
          variant={service.isActive ? 'ghost' : 'outline'}
          className={service.isActive ? 'text-destructive hover:text-destructive' : undefined}
          onClick={(event) => onStatus(event.currentTarget)}
        >
          {service.isActive ? (
            <CircleOff className="size-4" aria-hidden="true" />
          ) : (
            <RotateCcw className="size-4" aria-hidden="true" />
          )}
          {service.isActive ? t('deactivate') : t('activate')}
        </Button>
      )}
    </div>
  );
}

function LoadingState() {
  const t = useTranslations('services');
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
  const t = useTranslations('services');
  return (
    <Card>
      <CardContent className="py-12 text-center sm:py-14">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-muted text-secondary">
          {filtered ? <Search className="size-6" /> : <Scissors className="size-6" />}
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

export function ServicesList() {
  const t = useTranslations();
  const locale = useLocale();
  const { session } = useSession();
  const { can } = usePermissions();
  const tenantId = session?.tenant?.id ?? '';
  const currencyCode = session?.tenant?.currencyCode ?? 'PKR';
  const canView = can(permissions.catalogRead);
  const canCreate = can(permissions.catalogCreate);
  const canEdit = can(permissions.catalogUpdate);
  const canChangeStatus = can(permissions.catalogDeactivate);
  const hasActions = canEdit || canChangeStatus;
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<CatalogService | null>(null);
  const [statusService, setStatusService] = useState<CatalogService | null>(null);
  const [formTrigger, setFormTrigger] = useState<HTMLElement | null>(null);
  const [statusTrigger, setStatusTrigger] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const params = { search, categoryId, isActive, page, pageSize: PAGE_SIZE };
  const query = useCatalogServices(tenantId, params, canView);
  const activeCategoriesQuery = useServiceCategories(
    tenantId,
    { search: '', isActive: true, page: 1, pageSize: 100 },
    canView,
  );
  const inactiveCategoriesQuery = useServiceCategories(
    tenantId,
    { search: '', isActive: false, page: 1, pageSize: 100 },
    canView && canChangeStatus,
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
    setIsActive(true);
    setPage(1);
  }

  function openCreate(element: HTMLElement) {
    setFormTrigger(element);
    setEditingService(null);
    setFormOpen(true);
  }

  function openEdit(service: CatalogService, element: HTMLElement) {
    setFormTrigger(element);
    setEditingService(service);
    setFormOpen(true);
  }

  function openStatus(service: CatalogService, element: HTMLElement) {
    setStatusTrigger(element);
    setStatusService(service);
  }

  const items = query.data?.items ?? [];
  const filtered = Boolean(search || categoryId || !isActive);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-secondary">{t('services.catalog')}</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
            {t('services.title')}
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">{t('services.description')}</p>
        </div>
        {canCreate && (
          <Button type="button" className="shrink-0" onClick={(e) => openCreate(e.currentTarget)}>
            <Plus className="size-4" aria-hidden="true" />
            {t('services.add')}
          </Button>
        )}
      </header>

      <Card>
        <CardContent className="pt-5 sm:pt-6">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(12rem,0.45fr)_12rem] md:items-end">
            <div className="min-w-0">
              <label htmlFor="service-search" className="sr-only">
                {t('services.search')}
              </label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="service-search"
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder={t('services.search')}
                  className="ps-10 pe-11"
                />
                {searchInput && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="absolute end-0 top-0"
                    aria-label={t('services.clearSearch')}
                    onClick={() => setSearchInput('')}
                  >
                    <X className="size-4" aria-hidden="true" />
                  </Button>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="service-category-filter" className="sr-only">
                {t('services.filterCategory')}
              </label>
              <select
                id="service-category-filter"
                value={categoryId}
                disabled={activeCategoriesQuery.isLoading || activeCategoriesQuery.isError}
                onChange={(event) => {
                  setCategoryId(event.target.value);
                  setPage(1);
                }}
                className="min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-start text-sm text-foreground shadow-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/35 disabled:opacity-55"
              >
                <option value="">{t('services.allCategories')}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                    {!category.isActive ? ` — ${t('services.inactive')}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="service-status" className="sr-only">
                {t('services.filterStatus')}
              </label>
              <select
                id="service-status"
                value={String(isActive)}
                onChange={(event) => {
                  setIsActive(event.target.value === 'true');
                  setPage(1);
                }}
                className="min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-start text-sm text-foreground shadow-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/35"
              >
                <option value="true">{t('services.active')}</option>
                {canChangeStatus && <option value="false">{t('services.inactive')}</option>}
              </select>
            </div>
          </div>
          <div className="mt-4 flex min-h-5 flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            {meta ? <p>{t('services.count', { count: meta.total })}</p> : <span />}
            <div className="flex items-center gap-3">
              {filtered && (
                <Button type="button" size="sm" variant="ghost" onClick={clearFilters}>
                  {t('services.clearFilters')}
                </Button>
              )}
              {query.isFetching && !query.isLoading && (
                <p className="flex items-center gap-2" role="status">
                  <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                  {t('services.refreshing')}
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
          title={t('services.loadFailed')}
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
            {items.map((service) => (
              <Card key={service.id}>
                <CardContent className="space-y-4 pt-5">
                  <div className="flex items-start justify-between gap-3">
                    <ServiceIdentity service={service} />
                    <StatusBadge active={service.isActive} />
                  </div>
                  <p className="text-sm text-muted-foreground" dir="auto">
                    {service.category.name}
                    {!service.category.isActive ? ` — ${t('services.inactive')}` : ''}
                  </p>
                  <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted/55 p-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">{t('services.basePrice')}</p>
                      <p className="mt-1 font-semibold" dir="auto">
                        {priceFormatter.format(Number(service.defaultPrice))}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('services.duration')}</p>
                      <p className="mt-1 flex items-center gap-1.5 font-semibold">
                        <Clock3 className="size-4 text-secondary" aria-hidden="true" />
                        {service.durationMinutes == null
                          ? t('services.notSet')
                          : t('services.durationValue', { count: service.durationMinutes })}
                      </p>
                    </div>
                  </div>
                  {hasActions && (
                    <div className="border-t border-border pt-3">
                      <ServiceActions
                        service={service}
                        canEdit={canEdit}
                        canChangeStatus={canChangeStatus}
                        onEdit={(element) => openEdit(service, element)}
                        onStatus={(element) => openStatus(service, element)}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed border-collapse text-start text-sm">
                <thead className="bg-muted/70 text-muted-foreground">
                  <tr>
                    <th scope="col" className="w-[23%] px-5 py-3 text-start font-medium">
                      {t('services.name')}
                    </th>
                    <th scope="col" className="w-[20%] px-5 py-3 text-start font-medium">
                      {t('services.category')}
                    </th>
                    <th scope="col" className="w-[17%] px-5 py-3 text-start font-medium">
                      {t('services.basePrice')}
                    </th>
                    <th scope="col" className="w-36 px-5 py-3 text-start font-medium">
                      {t('services.duration')}
                    </th>
                    <th scope="col" className="w-28 px-5 py-3 text-start font-medium">
                      {t('services.status')}
                    </th>
                    {hasActions && (
                      <th scope="col" className="w-72 px-5 py-3 text-end font-medium">
                        {t('services.actions')}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((service) => (
                    <tr key={service.id} className="align-middle hover:bg-muted/25">
                      <td className="px-5 py-4">
                        <ServiceIdentity service={service} />
                      </td>
                      <td className="px-5 py-4" dir="auto">
                        {service.category.name}
                        {!service.category.isActive && (
                          <span className="mt-1 block text-xs text-muted-foreground">
                            {t('services.inactiveCategory')}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 font-medium tabular-nums" dir="auto">
                        {priceFormatter.format(Number(service.defaultPrice))}
                      </td>
                      <td className="px-5 py-4">
                        {service.durationMinutes == null
                          ? t('services.notSet')
                          : t('services.durationValue', { count: service.durationMinutes })}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge active={service.isActive} />
                      </td>
                      {hasActions && (
                        <td className="px-5 py-4">
                          <ServiceActions
                            service={service}
                            canEdit={canEdit}
                            canChangeStatus={canChangeStatus}
                            onEdit={(element) => openEdit(service, element)}
                            onStatus={(element) => openStatus(service, element)}
                          />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {meta && meta.pageCount > 1 && (
        <nav className="flex items-center justify-between gap-4" aria-label={t('services.pages')}>
          <Button
            type="button"
            variant="outline"
            disabled={page <= 1 || query.isPlaceholderData}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
            {t('services.previous')}
          </Button>
          <p className="text-sm text-muted-foreground">
            {t('services.page', { page: meta.page, total: meta.pageCount })}
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={page >= meta.pageCount || query.isPlaceholderData}
            onClick={() => setPage((value) => value + 1)}
          >
            {t('services.next')}
            <ChevronRight className="size-4 rtl:rotate-180" aria-hidden="true" />
          </Button>
        </nav>
      )}

      {canCreate || canEdit ? (
        <ServiceFormDialog
          tenantId={tenantId}
          currencyCode={currencyCode}
          open={formOpen}
          service={editingService}
          returnFocus={formTrigger}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setEditingService(null);
          }}
        />
      ) : null}
      {canChangeStatus && (
        <ServiceStatusDialog
          tenantId={tenantId}
          service={statusService}
          returnFocus={statusTrigger}
          onOpenChange={(open) => {
            if (!open) setStatusService(null);
          }}
        />
      )}
    </div>
  );
}
