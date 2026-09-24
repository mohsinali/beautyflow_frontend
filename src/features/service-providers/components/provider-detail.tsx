'use client';

import Link from 'next/link';
import { ArrowLeft, Building2, CircleOff, LoaderCircle, Pencil, Scissors } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ErrorState } from '@/components/feedback/error-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/lib/api/error';
import { permissions } from '@/lib/permissions/permissions';
import { usePermissions, useSession } from '@/providers/session-provider';
import {
  useAssignableProviderServices,
  useAssignProviderBranch,
  useAssignProviderService,
  useProviderBranches,
  useRemoveProviderBranch,
  useRemoveProviderService,
  useServiceProvider,
  useSetServiceProviderActive,
} from '../hooks/use-service-providers';
import type { ProviderBranch, ServiceProvider } from '../types/service-provider';
import { ProviderFormDialog } from './provider-form-dialog';
import { ProviderPhoto } from './provider-photo';

function BranchAssignments({
  tenantId,
  provider,
  canManage,
}: {
  tenantId: string;
  provider: ServiceProvider;
  canManage: boolean;
}) {
  const t = useTranslations();
  const branches = useProviderBranches(tenantId, canManage);
  const assign = useAssignProviderBranch(tenantId, provider.id, provider.membershipId);
  const remove = useRemoveProviderBranch(tenantId, provider.id, provider.membershipId);
  const assigned = new Set(provider.assignedBranches.map((branch) => branch.id));
  if (!canManage) {
    return provider.assignedBranches.length ? (
      <div className="grid gap-3 sm:grid-cols-2">
        {provider.assignedBranches.map((branch) => (
          <div key={branch.id} className="rounded-xl border border-border p-3">
            <p className="font-medium" dir="auto">
              {branch.name}
            </p>
            {!branch.isActive && (
              <p className="text-xs text-muted-foreground">{t('providers.inactive')}</p>
            )}
          </div>
        ))}
      </div>
    ) : (
      <p className="py-5 text-center text-sm text-muted-foreground">{t('providers.noBranches')}</p>
    );
  }
  async function toggle(branch: ProviderBranch) {
    try {
      if (assigned.has(branch.id)) {
        if (!window.confirm(t('providers.removeBranchMessage', { branch: branch.name }))) return;
        await remove.mutateAsync(branch.id);
        toast.success(t('providers.branchRemoved'));
      } else {
        await assign.mutateAsync(branch.id);
        toast.success(t('providers.branchAssigned'));
      }
    } catch {
      toast.error(t('providers.branchUpdateFailed'));
    }
  }
  if (branches.isLoading)
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
        <LoaderCircle className="size-4 animate-spin" />
        {t('providers.relatedLoading')}
      </p>
    );
  if (branches.isError)
    return (
      <ErrorState
        error={branches.error}
        title={t('providers.branchesLoadFailed')}
        onRetry={() => void branches.refetch()}
      />
    );
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {branches.data?.map((branch) => (
        <div
          key={branch.id}
          className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"
        >
          <div className="min-w-0">
            <p className="font-medium" dir="auto">
              {branch.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {assigned.has(branch.id)
                ? t('providers.assigned')
                : branch.isActive
                  ? t('providers.notAssigned')
                  : t('providers.inactive')}
            </p>
          </div>
          {canManage && (
            <Button
              size="sm"
              variant={assigned.has(branch.id) ? 'ghost' : 'outline'}
              className={assigned.has(branch.id) ? 'text-destructive' : undefined}
              disabled={
                assign.isPending ||
                remove.isPending ||
                (!branch.isActive && !assigned.has(branch.id))
              }
              onClick={() => void toggle(branch)}
            >
              {assigned.has(branch.id) ? t('providers.removeBranch') : t('providers.assignBranch')}
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

function QualifiedServices({
  tenantId,
  provider,
  canManage,
}: {
  tenantId: string;
  provider: ServiceProvider;
  canManage: boolean;
}) {
  const t = useTranslations();
  const services = useAssignableProviderServices(tenantId, canManage);
  const assign = useAssignProviderService(tenantId, provider.id);
  const remove = useRemoveProviderService(tenantId, provider.id);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const assigned = new Map(provider.qualifications.map((service) => [service.id, service]));
  const categories = useMemo(
    () => [
      ...new Map(
        (services.data ?? []).map((service) => [service.category.id, service.category]),
      ).values(),
    ],
    [services.data],
  );
  if (!canManage) {
    return provider.qualifications.length ? (
      <div className="grid gap-3 sm:grid-cols-2">
        {provider.qualifications.map((service) => (
          <div key={service.id} className="rounded-xl border border-border p-3">
            <p className="font-medium" dir="auto">
              {service.name}
            </p>
            {service.category?.name && (
              <p className="text-xs text-muted-foreground" dir="auto">
                {service.category.name}
              </p>
            )}
          </div>
        ))}
      </div>
    ) : (
      <p className="py-5 text-center text-sm text-muted-foreground">{t('providers.noServices')}</p>
    );
  }
  const visible = (services.data ?? []).filter(
    (service) =>
      (!search || service.name.toLocaleLowerCase().includes(search.toLocaleLowerCase())) &&
      (!categoryId || service.category.id === categoryId),
  );
  async function toggle(serviceId: string, name: string) {
    try {
      if (assigned.has(serviceId)) {
        if (!window.confirm(t('providers.removeServiceMessage', { service: name }))) return;
        await remove.mutateAsync(serviceId);
        toast.success(t('providers.serviceRemoved'));
      } else {
        await assign.mutateAsync(serviceId);
        toast.success(t('providers.serviceAssigned'));
      }
    } catch {
      toast.error(t('providers.serviceUpdateFailed'));
    }
  }
  if (services.isLoading)
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
        <LoaderCircle className="size-4 animate-spin" />
        {t('providers.relatedLoading')}
      </p>
    );
  if (services.isError)
    return (
      <ErrorState
        error={services.error}
        title={t('providers.servicesLoadFailed')}
        onRetry={() => void services.refetch()}
      />
    );
  return (
    <div className="space-y-4">
      {canManage && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('providers.searchServices')}
          />
          <select
            className="min-h-11 rounded-xl border border-input bg-background px-3 text-start text-sm"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            <option value="">{t('providers.allCategories')}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      )}
      {provider.qualifications
        .filter((qualification) => !qualification.isActive)
        .map((service) => (
          <div
            key={service.id}
            className="flex items-center justify-between rounded-xl border border-border p-3"
          >
            <div>
              <p className="font-medium" dir="auto">
                {service.name}
              </p>
              <p className="text-xs text-muted-foreground">{t('providers.inactive')}</p>
            </div>
            {canManage && (
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                disabled={remove.isPending}
                onClick={() => void toggle(service.id, service.name)}
              >
                {t('providers.removeService')}
              </Button>
            )}
          </div>
        ))}
      {visible.length === 0 && provider.qualifications.length === 0 ? (
        <p className="py-5 text-center text-sm text-muted-foreground">
          {t('providers.noServices')}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {visible.map((service) => (
            <div
              key={service.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"
            >
              <div className="min-w-0">
                <p className="font-medium" dir="auto">
                  {service.name}
                </p>
                <p className="text-xs text-muted-foreground" dir="auto">
                  {service.category.name}
                </p>
              </div>
              {canManage && (
                <Button
                  size="sm"
                  variant={assigned.has(service.id) ? 'ghost' : 'outline'}
                  className={assigned.has(service.id) ? 'text-destructive' : undefined}
                  disabled={assign.isPending || remove.isPending}
                  onClick={() => void toggle(service.id, service.name)}
                >
                  {assigned.has(service.id)
                    ? t('providers.removeService')
                    : t('providers.assignService')}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProviderDetail({ providerId }: { providerId: string }) {
  const t = useTranslations();
  const { session } = useSession();
  const { can } = usePermissions();
  const tenantId = session?.tenant?.id ?? '';
  const canView = can(permissions.providerRead);
  const canEdit = can(permissions.providerUpdate);
  const canStatus = can(permissions.providerDeactivate);
  const canBranches = can(permissions.branchAccessAssign);
  const canServices = can(permissions.providerManageQualifications);
  const query = useServiceProvider(tenantId, providerId, canView);
  const status = useSetServiceProviderActive(tenantId);
  const [editOpen, setEditOpen] = useState(false);
  const [editTrigger, setEditTrigger] = useState<HTMLElement | null>(null);
  if (!canView || !tenantId)
    return (
      <Card role="alert">
        <CardContent className="flex gap-3 pt-6">
          <CircleOff className="size-6 text-destructive" />
          <div>
            <h1 className="font-semibold">{t('unauthorized.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('unauthorized.description')}</p>
          </div>
        </CardContent>
      </Card>
    );
  if (query.isLoading)
    return (
      <Card role="status">
        <CardContent className="py-14 text-center">
          <LoaderCircle className="mx-auto size-7 animate-spin text-secondary" />
          <p className="mt-3 text-sm text-muted-foreground">{t('providers.detailLoading')}</p>
        </CardContent>
      </Card>
    );
  if (query.isError) {
    const missing = query.error instanceof ApiError && query.error.status === 404;
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost">
          <Link href="/dashboard/service-providers">
            <ArrowLeft className="size-4 rtl:rotate-180" />
            {t('providers.back')}
          </Link>
        </Button>
        {missing ? (
          <Card>
            <CardContent className="py-14 text-center">
              <h1 className="text-xl font-semibold">{t('providers.notFound')}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('providers.notFoundDescription')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <ErrorState
            error={query.error}
            title={t('providers.loadDetailFailed')}
            onRetry={() => void query.refetch()}
          />
        )}
      </div>
    );
  }
  const provider = query.data!;
  async function toggleStatus() {
    const activating = !provider.isActive;
    if (
      !window.confirm(
        activating ? t('providers.activateMessage') : t('providers.deactivateMessage'),
      )
    )
      return;
    try {
      await status.mutateAsync({ providerId, isActive: activating });
      toast.success(activating ? t('providers.activated') : t('providers.deactivated'));
    } catch {
      toast.error(t('providers.statusFailed'));
    }
  }
  return (
    <div className="space-y-6">
      <Button asChild variant="ghost">
        <Link href="/dashboard/service-providers">
          <ArrowLeft className="size-4 rtl:rotate-180" />
          {t('providers.back')}
        </Link>
      </Button>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold" dir="auto">
            {provider.displayName}
          </h1>
          <p className="mt-1 text-muted-foreground" dir="auto">
            {provider.jobTitle || t('providers.providerProfile')}
          </p>
          <p className="mt-2 text-sm font-medium">
            {provider.effectivelyActive ? t('providers.active') : t('providers.inactive')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <Button
              variant="outline"
              onClick={(event) => {
                setEditTrigger(event.currentTarget);
                setEditOpen(true);
              }}
            >
              <Pencil className="size-4" />
              {t('providers.edit')}
            </Button>
          )}
          {canStatus && (
            <Button
              variant={provider.isActive ? 'ghost' : 'default'}
              className={provider.isActive ? 'text-destructive' : undefined}
              disabled={status.isPending}
              onClick={() => void toggleStatus()}
            >
              {provider.isActive ? t('providers.deactivate') : t('providers.activate')}
            </Button>
          )}
        </div>
      </header>
      <Card>
        <CardContent className="pt-6">
          <ProviderPhoto tenantId={tenantId} provider={provider} canEdit={canEdit} />
          <div className="mt-6 grid gap-4 border-t border-border pt-6 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">{t('providers.email')}</p>
              <p dir="auto">{provider.user.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('providers.phone')}</p>
              <p dir="auto">{provider.phone || t('providers.notSet')}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs text-muted-foreground">{t('providers.biography')}</p>
              <p className="mt-1 whitespace-pre-wrap" dir="auto">
                {provider.bio || t('providers.notSet')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="mb-5 flex items-center gap-2">
            <Building2 className="size-5 text-secondary" />
            <div>
              <h2 className="text-lg font-semibold">{t('providers.branchAssignments')}</h2>
              <p className="text-sm text-muted-foreground">{t('providers.branchDescription')}</p>
            </div>
          </div>
          <BranchAssignments tenantId={tenantId} provider={provider} canManage={canBranches} />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="mb-5 flex items-center gap-2">
            <Scissors className="size-5 text-secondary" />
            <div>
              <h2 className="text-lg font-semibold">{t('providers.qualifiedServices')}</h2>
              <p className="text-sm text-muted-foreground">{t('providers.servicesDescription')}</p>
            </div>
          </div>
          <QualifiedServices tenantId={tenantId} provider={provider} canManage={canServices} />
        </CardContent>
      </Card>
      {canEdit && (
        <ProviderFormDialog
          tenantId={tenantId}
          open={editOpen}
          provider={provider}
          returnFocus={editTrigger}
          onOpenChange={setEditOpen}
        />
      )}
    </div>
  );
}
