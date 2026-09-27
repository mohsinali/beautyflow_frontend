'use client';

import {
  Building2,
  ChevronLeft,
  ChevronRight,
  CircleOff,
  LoaderCircle,
  Pencil,
  Plus,
  RotateCcw,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ErrorState } from '@/components/feedback/error-state';
import { permissions } from '@/lib/permissions/permissions';
import { cn } from '@/lib/utils';
import { usePermissions, useSession } from '@/providers/session-provider';
import { useBranches } from '../hooks/use-branches';
import type { Branch } from '../types/branch';
import { BranchFormDialog } from './branch-form-dialog';
import { BranchStatusDialog } from './branch-status-dialog';

function StatusBadge({ active }: { active: boolean }) {
  const t = useTranslations('branches');
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
        active ? 'bg-success/12 text-success' : 'bg-muted text-muted-foreground',
      )}
    >
      {t(active ? 'active' : 'inactive')}
    </span>
  );
}

export function BranchList() {
  const t = useTranslations();
  const { session, activeBranch, refreshSession } = useSession();
  const { can } = usePermissions();
  const tenantId = session?.tenant?.id ?? '';
  const canView = can(permissions.branchView);
  const canCreate = can(permissions.branchCreate);
  const canEdit = can(permissions.branchUpdate);
  const canStatus = can(permissions.branchDeactivate);
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [statusBranch, setStatusBranch] = useState<Branch | null>(null);
  const query = useBranches(tenantId, page, canView);

  if (!canView || !tenantId || !session?.tenant)
    return (
      <Card role="alert">
        <CardContent className="pt-6">
          <h1 className="text-lg font-semibold">{t('unauthorized.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('unauthorized.description')}</p>
        </CardContent>
      </Card>
    );

  const items = query.data?.items ?? [];
  const meta = query.data?.meta;
  const actions = (branch: Branch) => (
    <div className="flex flex-wrap justify-end gap-2">
      {canEdit && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setEditing(branch);
            setFormOpen(true);
          }}
        >
          <Pencil className="size-4" />
          {t('branches.editShort')}
        </Button>
      )}
      {canStatus && (
        <Button size="sm" variant="ghost" onClick={() => setStatusBranch(branch)}>
          {branch.isActive ? <CircleOff className="size-4" /> : <RotateCcw className="size-4" />}
          {t(branch.isActive ? 'branches.deactivateShort' : 'branches.activateShort')}
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {t('branches.title')}
          </h1>
          <p className="mt-2 text-muted-foreground">{t('branches.description')}</p>
        </div>
        {canCreate && (
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" />
            {t('branches.add')}
          </Button>
        )}
      </header>
      {query.isLoading ? (
        <Card role="status">
          <CardContent className="py-14 text-center">
            <LoaderCircle className="mx-auto size-7 animate-spin text-secondary" />
            <p className="mt-3 text-sm text-muted-foreground">{t('branches.loading')}</p>
          </CardContent>
        </Card>
      ) : query.isError ? (
        <ErrorState
          error={query.error}
          title={t('branches.loadFailed')}
          description={t('branches.loadFailedDescription')}
          onRetry={() => void query.refetch()}
        />
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-muted text-secondary">
              <Building2 />
            </span>
            <h2 className="mt-4 font-semibold">{t('branches.empty')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('branches.emptyDescription')}</p>
            {canCreate && (
              <Button className="mt-4" onClick={() => setFormOpen(true)}>
                <Plus className="size-4" />
                {t('branches.addFirst')}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 text-start">{t('branches.branch')}</th>
                    <th className="px-5 py-3 text-start">{t('branches.timezone')}</th>
                    <th className="px-5 py-3 text-start">{t('branches.phone')}</th>
                    <th className="px-5 py-3 text-start">{t('branches.status')}</th>
                    <th className="px-5 py-3 text-end">{t('branches.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((branch) => (
                    <tr key={branch.id} className="border-t border-border">
                      <td className="px-5 py-4">
                        <p className="font-semibold" dir="auto">
                          {branch.name}
                          {activeBranch?.id === branch.id && (
                            <span className="ms-2 text-xs font-medium text-secondary">
                              {t('branches.current')}
                            </span>
                          )}
                        </p>
                        {branch.address && (
                          <p className="mt-1 max-w-md text-muted-foreground" dir="auto">
                            {branch.address}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4" dir="ltr">
                        {branch.timezone}
                      </td>
                      <td className="px-5 py-4" dir="ltr">
                        {branch.phone || t('branches.notProvided')}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge active={branch.isActive} />
                      </td>
                      <td className="px-5 py-4">{actions(branch)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <div className="space-y-3 md:hidden">
            {items.map((branch) => (
              <Card key={branch.id}>
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold" dir="auto">
                        {branch.name}
                      </p>
                      {activeBranch?.id === branch.id && (
                        <p className="text-xs text-secondary">{t('branches.current')}</p>
                      )}
                    </div>
                    <StatusBadge active={branch.isActive} />
                  </div>
                  <p className="mt-3 text-sm" dir="ltr">
                    {branch.timezone}
                  </p>
                  {branch.address && (
                    <p className="mt-1 text-sm text-muted-foreground" dir="auto">
                      {branch.address}
                    </p>
                  )}
                  {branch.phone && (
                    <p className="mt-1 text-sm text-muted-foreground" dir="ltr">
                      {branch.phone}
                    </p>
                  )}
                  <div className="mt-4">{actions(branch)}</div>
                </CardContent>
              </Card>
            ))}
          </div>
          {meta && meta.pageCount > 1 && (
            <nav className="flex items-center justify-between" aria-label={t('branches.pages')}>
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((value) => value - 1)}
              >
                <ChevronLeft className="size-4 rtl:rotate-180" />
                {t('branches.previous')}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t('branches.page', { page: meta.page, total: meta.pageCount })}
              </span>
              <Button
                variant="outline"
                disabled={page >= meta.pageCount}
                onClick={() => setPage((value) => value + 1)}
              >
                {t('branches.next')}
                <ChevronRight className="size-4 rtl:rotate-180" />
              </Button>
            </nav>
          )}
        </>
      )}
      <BranchFormDialog
        tenantId={tenantId}
        tenantTimezone={session.tenant.timezone}
        branch={editing}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={refreshSession}
      />
      <BranchStatusDialog
        tenantId={tenantId}
        branch={statusBranch}
        onOpenChange={(open) => !open && setStatusBranch(null)}
      />
    </div>
  );
}
