'use client';

import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  CircleOff,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  UserRound,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ErrorState } from '@/components/feedback/error-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/lib/api/error';
import { permissions } from '@/lib/permissions/permissions';
import { cn } from '@/lib/utils';
import { usePermissions, useSession } from '@/providers/session-provider';
import {
  useAssignableProviderServices,
  useProviderBranches,
  useServiceProviders,
  useSetServiceProviderActive,
} from '../hooks/use-service-providers';
import type { ServiceProvider } from '../types/service-provider';
import { ProviderAvatar } from './provider-avatar';
import { ProviderFormDialog } from './provider-form-dialog';

const PAGE_SIZE = 20;

function Status({ active }: { active: boolean }) {
  const t = useTranslations('providers');
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
        active ? 'bg-success/12 text-success' : 'bg-muted text-muted-foreground',
      )}
    >
      {active ? t('active') : t('inactive')}
    </span>
  );
}

export function ProviderList() {
  const t = useTranslations();
  const router = useRouter();
  const { session } = useSession();
  const { can } = usePermissions();
  const tenantId = session?.tenant?.id ?? '';
  const canView = can(permissions.providerRead);
  const canCreate = can(permissions.providerCreate);
  const canEdit = can(permissions.providerUpdate);
  const canStatus = can(permissions.providerDeactivate);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [branchId, setBranchId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceProvider | null>(null);
  const [formTrigger, setFormTrigger] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);
  const query = useServiceProviders(
    tenantId,
    { search, branchId, catalogServiceId: serviceId, isActive, page, pageSize: PAGE_SIZE },
    canView,
  );
  const branches = useProviderBranches(tenantId, canView);
  const services = useAssignableProviderServices(tenantId, canView);
  const statusMutation = useSetServiceProviderActive(tenantId);
  const filtered = Boolean(search || branchId || serviceId || !isActive);
  const clear = () => {
    setSearchInput('');
    setSearch('');
    setBranchId('');
    setServiceId('');
    setIsActive(true);
    setPage(1);
  };

  async function toggleStatus(provider: ServiceProvider) {
    const activating = !provider.isActive;
    if (
      !window.confirm(
        activating ? t('providers.activateMessage') : t('providers.deactivateMessage'),
      )
    )
      return;
    try {
      await statusMutation.mutateAsync({ providerId: provider.id, isActive: activating });
      toast.success(activating ? t('providers.activated') : t('providers.deactivated'));
    } catch (error) {
      const requestId = error instanceof ApiError ? error.requestId : undefined;
      toast.error(
        `${t('providers.statusFailed')}${requestId ? ` ${t('errors.requestId', { id: requestId })}` : ''}`,
      );
    }
  }

  if (!canView || !tenantId)
    return (
      <Card role="alert">
        <CardContent className="flex gap-4 pt-6">
          <CircleOff className="size-6 text-destructive" />
          <div>
            <h1 className="font-semibold">{t('unauthorized.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('unauthorized.description')}</p>
          </div>
        </CardContent>
      </Card>
    );
  const items = query.data?.items ?? [];
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold">{t('providers.title')}</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">{t('providers.description')}</p>
        </div>
        {canCreate && (
          <Button
            onClick={(event) => {
              setEditing(null);
              setFormTrigger(event.currentTarget);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" />
            {t('providers.add')}
          </Button>
        )}
      </header>
      <Card>
        <CardContent className="pt-5 sm:pt-6">
          <div className="grid gap-3 lg:grid-cols-[minmax(14rem,1fr)_minmax(10rem,.5fr)_minmax(10rem,.5fr)_10rem]">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder={t('providers.search')}
                className="ps-10 pe-10"
                aria-label={t('providers.search')}
              />
              {searchInput && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute end-0 top-0"
                  aria-label={t('providers.clearSearch')}
                  onClick={() => setSearchInput('')}
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
            <select
              value={branchId}
              onChange={(event) => {
                setBranchId(event.target.value);
                setPage(1);
              }}
              className="min-h-11 rounded-xl border border-input bg-background px-3 text-start text-sm"
              aria-label={t('providers.filterBranch')}
            >
              <option value="">{t('providers.allBranches')}</option>
              {branches.data?.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
            <select
              value={serviceId}
              onChange={(event) => {
                setServiceId(event.target.value);
                setPage(1);
              }}
              className="min-h-11 rounded-xl border border-input bg-background px-3 text-start text-sm"
              aria-label={t('providers.filterService')}
            >
              <option value="">{t('providers.allServices')}</option>
              {services.data?.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
            <select
              value={String(isActive)}
              onChange={(event) => {
                setIsActive(event.target.value === 'true');
                setPage(1);
              }}
              className="min-h-11 rounded-xl border border-input bg-background px-3 text-start text-sm"
              aria-label={t('providers.filterStatus')}
            >
              <option value="true">{t('providers.active')}</option>
              {canStatus && <option value="false">{t('providers.inactive')}</option>}
            </select>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>{query.data && t('providers.count', { count: query.data.meta.total })}</span>
            {filtered && (
              <Button size="sm" variant="ghost" onClick={clear}>
                {t('providers.clearFilters')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      {query.isLoading ? (
        <Card role="status">
          <CardContent className="py-14 text-center">
            <LoaderCircle className="mx-auto size-7 animate-spin text-secondary" />
            <p className="mt-3 text-sm text-muted-foreground">{t('providers.loading')}</p>
          </CardContent>
        </Card>
      ) : query.isError ? (
        <ErrorState
          error={query.error}
          title={t('providers.loadFailed')}
          onRetry={() => void query.refetch()}
        />
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center">
            <UserRound className="mx-auto size-10 text-secondary" />
            <h2 className="mt-4 font-semibold">
              {filtered ? t('providers.noMatches') : t('providers.empty')}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {filtered ? t('providers.noMatchesDescription') : t('providers.emptyDescription')}
            </p>
            {filtered && (
              <Button className="mt-4" variant="outline" onClick={clear}>
                {t('providers.clearFilters')}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 md:hidden">
            {items.map((provider) => (
              <Card key={provider.id}>
                <CardContent className="space-y-4 pt-5">
                  <div className="flex items-start gap-3">
                    <ProviderAvatar name={provider.displayName} photoUrl={provider.photoUrl} />
                    <div className="min-w-0 flex-1">
                      <Link
                        className="font-semibold hover:underline"
                        href={`/dashboard/service-providers/${provider.id}`}
                        dir="auto"
                      >
                        {provider.displayName}
                      </Link>
                      <p className="text-sm text-muted-foreground" dir="auto">
                        {provider.jobTitle || provider.user.email}
                      </p>
                    </div>
                    <Status active={provider.effectivelyActive} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">{t('providers.branches')}</p>
                      <p>{provider.assignedBranches.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {t('providers.qualifiedServices')}
                      </p>
                      <p>{provider.qualifiedServiceCount}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/dashboard/service-providers/${provider.id}`}>
                        {t('providers.viewProfile')}
                      </Link>
                    </Button>
                    {canEdit && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(event) => {
                          setEditing(provider);
                          setFormTrigger(event.currentTarget);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil className="size-4" />
                        {t('providers.edit')}
                      </Button>
                    )}
                    {canStatus && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={statusMutation.isPending}
                        onClick={() => void toggleStatus(provider)}
                      >
                        {provider.isActive ? t('providers.deactivate') : t('providers.activate')}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/70 text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 text-start font-medium">{t('providers.provider')}</th>
                    <th className="px-5 py-3 text-start font-medium">{t('providers.branches')}</th>
                    <th className="px-5 py-3 text-start font-medium">
                      {t('providers.qualifiedServices')}
                    </th>
                    <th className="px-5 py-3 text-start font-medium">{t('providers.status')}</th>
                    <th className="px-5 py-3 text-end font-medium">{t('providers.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((provider) => (
                    <tr key={provider.id} className="hover:bg-muted/25">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <ProviderAvatar
                            name={provider.displayName}
                            photoUrl={provider.photoUrl}
                          />
                          <div>
                            <Link
                              className="font-semibold hover:underline"
                              href={`/dashboard/service-providers/${provider.id}`}
                              dir="auto"
                            >
                              {provider.displayName}
                            </Link>
                            <p className="text-xs text-muted-foreground" dir="auto">
                              {provider.jobTitle || provider.user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4" dir="auto">
                        {provider.assignedBranches.map((branch) => branch.name).join(', ') ||
                          t('providers.none')}
                      </td>
                      <td className="px-5 py-4">{provider.qualifiedServiceCount}</td>
                      <td className="px-5 py-4">
                        <Status active={provider.effectivelyActive} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/dashboard/service-providers/${provider.id}`}>
                              {t('providers.viewProfile')}
                            </Link>
                          </Button>
                          {canEdit && (
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label={t('providers.edit')}
                              onClick={(event) => {
                                setEditing(provider);
                                setFormTrigger(event.currentTarget);
                                setFormOpen(true);
                              }}
                            >
                              <Pencil className="size-4" />
                            </Button>
                          )}
                          {canStatus && (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={statusMutation.isPending}
                              onClick={() => void toggleStatus(provider)}
                            >
                              {provider.isActive
                                ? t('providers.deactivate')
                                : t('providers.activate')}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
      {query.data && query.data.meta.pageCount > 1 && (
        <nav className="flex items-center justify-between" aria-label={t('providers.pages')}>
          <Button
            variant="outline"
            disabled={page <= 1 || query.isPlaceholderData}
            onClick={() => setPage((value) => value - 1)}
          >
            <ChevronLeft className="size-4 rtl:rotate-180" />
            {t('providers.previous')}
          </Button>
          <p className="text-sm text-muted-foreground">
            {t('providers.page', { page: query.data.meta.page, total: query.data.meta.pageCount })}
          </p>
          <Button
            variant="outline"
            disabled={page >= query.data.meta.pageCount || query.isPlaceholderData}
            onClick={() => setPage((value) => value + 1)}
          >
            {t('providers.next')}
            <ChevronRight className="size-4 rtl:rotate-180" />
          </Button>
        </nav>
      )}
      {(canCreate || canEdit) && (
        <ProviderFormDialog
          tenantId={tenantId}
          open={formOpen}
          provider={editing}
          returnFocus={formTrigger}
          onCreated={(provider) => router.push(`/dashboard/service-providers/${provider.id}`)}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setEditing(null);
          }}
        />
      )}
    </div>
  );
}
