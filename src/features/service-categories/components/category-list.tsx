'use client';

import {
  ChevronLeft,
  ChevronRight,
  CircleOff,
  FolderOpen,
  LoaderCircle,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ErrorState } from '@/components/feedback/error-state';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/lib/api/error';
import { permissions } from '@/lib/permissions/permissions';
import { cn } from '@/lib/utils';
import { usePermissions, useSession } from '@/providers/session-provider';
import { CategoryFormDialog } from './category-form-dialog';
import { CategoryStatusDialog } from './category-status-dialog';
import { useServiceCategories } from '../hooks/use-service-categories';
import type { ServiceCategory } from '../types/service-category';

const PAGE_SIZE = 20;

function StatusBadge({ active }: { active: boolean }) {
  const t = useTranslations('categories');
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

function CategoryIdentity({ category }: { category: ServiceCategory }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span
        className="mt-0.5 size-3 shrink-0 rounded-full border border-black/10 shadow-sm"
        style={{ backgroundColor: category.color ?? 'var(--muted)' }}
        aria-hidden="true"
      />
      <div className="min-w-0">
        <p className="font-semibold" dir="auto">
          {category.name}
        </p>
        {category.iconKey && (
          <p className="mt-1 truncate text-xs text-muted-foreground" dir="ltr">
            {category.iconKey}
          </p>
        )}
      </div>
    </div>
  );
}

function CategoryActions({
  category,
  canEdit,
  canChangeStatus,
  onEdit,
  onStatus,
}: {
  category: ServiceCategory;
  canEdit: boolean;
  canChangeStatus: boolean;
  onEdit: (element: HTMLButtonElement) => void;
  onStatus: (element: HTMLButtonElement) => void;
}) {
  const t = useTranslations('categories');
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
          variant={category.isActive ? 'ghost' : 'outline'}
          className={category.isActive ? 'text-destructive hover:text-destructive' : undefined}
          onClick={(event) => onStatus(event.currentTarget)}
        >
          {category.isActive ? (
            <CircleOff className="size-4" aria-hidden="true" />
          ) : (
            <RotateCcw className="size-4" aria-hidden="true" />
          )}
          {category.isActive ? t('deactivate') : t('activate')}
        </Button>
      )}
    </div>
  );
}

function LoadingState() {
  const t = useTranslations('categories');
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
  const t = useTranslations('categories');
  return (
    <Card>
      <CardContent className="py-12 text-center sm:py-14">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-muted text-secondary">
          {filtered ? <Search className="size-6" /> : <FolderOpen className="size-6" />}
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

export function CategoryList() {
  const t = useTranslations();
  const { session } = useSession();
  const { can } = usePermissions();
  const tenantId = session?.tenant?.id ?? '';
  const canView = can(permissions.serviceCategoryRead);
  const canCreate = can(permissions.serviceCategoryCreate);
  const canEdit = can(permissions.serviceCategoryUpdate);
  const canChangeStatus = can(permissions.serviceCategoryDeactivate);
  const hasActions = canEdit || canChangeStatus;
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [statusCategory, setStatusCategory] = useState<ServiceCategory | null>(null);
  const [formTrigger, setFormTrigger] = useState<HTMLElement | null>(null);
  const [statusTrigger, setStatusTrigger] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const params = { search, isActive, page, pageSize: PAGE_SIZE };
  const query = useServiceCategories(tenantId, params, canView);

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

  function openCreate(element: HTMLElement) {
    setFormTrigger(element);
    setEditingCategory(null);
    setFormOpen(true);
  }

  function openEdit(category: ServiceCategory, element: HTMLElement) {
    setFormTrigger(element);
    setEditingCategory(category);
    setFormOpen(true);
  }

  function openStatus(category: ServiceCategory, element: HTMLElement) {
    setStatusTrigger(element);
    setStatusCategory(category);
  }

  const items = query.data?.items ?? [];
  const meta = query.data?.meta;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-secondary">{t('categories.catalog')}</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
            {t('categories.title')}
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">{t('categories.description')}</p>
        </div>
        {canCreate && (
          <Button type="button" className="shrink-0" onClick={(e) => openCreate(e.currentTarget)}>
            <Plus className="size-4" aria-hidden="true" />
            {t('categories.add')}
          </Button>
        )}
      </header>

      <Card>
        <CardContent className="pt-5 sm:pt-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="min-w-0 flex-1">
              <label htmlFor="category-search" className="sr-only">
                {t('categories.search')}
              </label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="category-search"
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder={t('categories.search')}
                  className="ps-10 pe-11"
                />
                {searchInput && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="absolute end-0 top-0"
                    aria-label={t('categories.clearSearch')}
                    onClick={() => setSearchInput('')}
                  >
                    <X className="size-4" aria-hidden="true" />
                  </Button>
                )}
              </div>
            </div>
            {canChangeStatus && (
              <div className="md:w-48">
                <label htmlFor="category-status" className="sr-only">
                  {t('categories.status')}
                </label>
                <select
                  id="category-status"
                  value={String(isActive)}
                  onChange={(event) => {
                    setIsActive(event.target.value === 'true');
                    setPage(1);
                  }}
                  className="min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-start text-sm text-foreground shadow-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/35"
                >
                  <option value="true">{t('categories.active')}</option>
                  <option value="false">{t('categories.inactive')}</option>
                </select>
              </div>
            )}
          </div>
          <div className="mt-4 flex min-h-5 items-center justify-between gap-3 text-sm text-muted-foreground">
            {meta ? <p>{t('categories.count', { count: meta.total })}</p> : <span />}
            {query.isFetching && !query.isLoading && (
              <p className="flex items-center gap-2" role="status">
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                {t('categories.refreshing')}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState
          error={query.error}
          title={t('categories.loadFailed')}
          description={
            query.error instanceof ApiError && query.error.status === 403
              ? t('errors.forbidden')
              : undefined
          }
          onRetry={() => void query.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          filtered={Boolean(search) || !isActive}
          onClear={() => {
            setSearchInput('');
            setIsActive(true);
            setPage(1);
          }}
        />
      ) : (
        <>
          <div className="grid gap-3 md:hidden">
            {items.map((category) => (
              <Card key={category.id}>
                <CardContent className="space-y-4 pt-5">
                  <div className="flex items-start justify-between gap-3">
                    <CategoryIdentity category={category} />
                    <StatusBadge active={category.isActive} />
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground" dir="auto">
                    {category.description || t('categories.noDescription')}
                  </p>
                  <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                    <span className="text-xs text-muted-foreground">
                      {t('categories.orderValue', { order: category.sortOrder })}
                    </span>
                    {hasActions && (
                      <CategoryActions
                        category={category}
                        canEdit={canEdit}
                        canChangeStatus={canChangeStatus}
                        onEdit={(element) => openEdit(category, element)}
                        onStatus={(element) => openStatus(category, element)}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed border-collapse text-start text-sm">
                <thead className="bg-muted/70 text-muted-foreground">
                  <tr>
                    <th scope="col" className="w-[25%] px-5 py-3 text-start font-medium">
                      {t('categories.name')}
                    </th>
                    <th scope="col" className="px-5 py-3 text-start font-medium">
                      {t('categories.descriptionLabel')}
                    </th>
                    <th scope="col" className="w-28 px-5 py-3 text-start font-medium">
                      {t('categories.status')}
                    </th>
                    <th scope="col" className="w-24 px-5 py-3 text-start font-medium">
                      {t('categories.sortOrder')}
                    </th>
                    {hasActions && (
                      <th scope="col" className="w-64 px-5 py-3 text-end font-medium">
                        {t('categories.actions')}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((category) => (
                    <tr key={category.id} className="align-top hover:bg-muted/25">
                      <td className="px-5 py-4">
                        <CategoryIdentity category={category} />
                      </td>
                      <td className="px-5 py-4 text-muted-foreground" dir="auto">
                        <p className="line-clamp-2 leading-6">
                          {category.description || t('categories.noDescription')}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge active={category.isActive} />
                      </td>
                      <td className="px-5 py-4 tabular-nums">{category.sortOrder}</td>
                      {hasActions && (
                        <td className="px-5 py-4">
                          <CategoryActions
                            category={category}
                            canEdit={canEdit}
                            canChangeStatus={canChangeStatus}
                            onEdit={(element) => openEdit(category, element)}
                            onStatus={(element) => openStatus(category, element)}
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
        <nav className="flex items-center justify-between gap-4" aria-label={t('categories.pages')}>
          <Button
            type="button"
            variant="outline"
            disabled={page <= 1 || query.isPlaceholderData}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
            {t('categories.previous')}
          </Button>
          <p className="text-sm text-muted-foreground">
            {t('categories.page', { page: meta.page, total: meta.pageCount })}
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={page >= meta.pageCount || query.isPlaceholderData}
            onClick={() => setPage((value) => value + 1)}
          >
            {t('categories.next')}
            <ChevronRight className="size-4 rtl:rotate-180" aria-hidden="true" />
          </Button>
        </nav>
      )}

      {canCreate || canEdit ? (
        <CategoryFormDialog
          tenantId={tenantId}
          open={formOpen}
          category={editingCategory}
          returnFocus={formTrigger}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setEditingCategory(null);
          }}
        />
      ) : null}
      {canChangeStatus && (
        <CategoryStatusDialog
          tenantId={tenantId}
          category={statusCategory}
          returnFocus={statusTrigger}
          onOpenChange={(open) => {
            if (!open) setStatusCategory(null);
          }}
        />
      )}
    </div>
  );
}
