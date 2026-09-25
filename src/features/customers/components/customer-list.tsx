'use client';

import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  CircleOff,
  LoaderCircle,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  UsersRound,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ErrorState } from '@/components/feedback/error-state';
import { Input } from '@/components/ui/input';
import { permissions } from '@/lib/permissions/permissions';
import { cn } from '@/lib/utils';
import { useActiveBranch, usePermissions, useSession } from '@/providers/session-provider';
import { useCustomers } from '../hooks/use-customers';
import type { Customer, CustomerStatus } from '../types/customer';
import { CustomerFormDialog } from './customer-form-dialog';
import { CustomerStatusDialog } from './customer-status-dialog';

const PAGE_SIZE = 20;
function Badge({ active }: { active: boolean }) {
  const t = useTranslations('customers');
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

export function CustomerList() {
  const t = useTranslations();
  const { session } = useSession();
  const { activeBranch } = useActiveBranch();
  const { can } = usePermissions();
  const tenantId = session?.tenant?.id ?? '';
  const canView = can(permissions.customerRead);
  const canCreate = can(permissions.customerCreate);
  const canEdit = can(permissions.customerUpdate);
  const canStatus = can(permissions.customerDeactivate);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<CustomerStatus>('ACTIVE');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [statusCustomer, setStatusCustomer] = useState<Customer | null>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);
  const query = useCustomers(tenantId, { search, status, page, pageSize: PAGE_SIZE }, canView);
  if (!canView || !tenantId)
    return (
      <Card role="alert">
        <CardContent className="pt-6">
          <h1 className="text-lg font-semibold">{t('unauthorized.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('unauthorized.description')}</p>
        </CardContent>
      </Card>
    );
  const filtered = Boolean(search || status !== 'ACTIVE');
  const items = query.data?.items ?? [];
  const meta = query.data?.meta;
  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (customer: Customer) => {
    setEditing(customer);
    setFormOpen(true);
  };
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {t('customers.title')}
          </h1>
          <p className="mt-2 text-muted-foreground">{t('customers.description')}</p>
        </div>
        {canCreate && (
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            {t('customers.add')}
          </Button>
        )}
      </header>
      <Card>
        <CardContent className="pt-5 sm:pt-6">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <label className="sr-only" htmlFor="customer-search">
                {t('customers.search')}
              </label>
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="customer-search"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder={t('customers.search')}
                className="ps-10"
              />
            </div>
            <div>
              <label className="sr-only" htmlFor="customer-status">
                {t('customers.filterStatus')}
              </label>
              <select
                id="customer-status"
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value as CustomerStatus);
                  setPage(1);
                }}
                className="h-11 min-w-44 rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option value="ALL">{t('customers.all')}</option>
                <option value="ACTIVE">{t('customers.activeCustomers')}</option>
                <option value="INACTIVE">{t('customers.inactiveCustomers')}</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
      {query.isLoading ? (
        <Card role="status">
          <CardContent className="py-14 text-center">
            <LoaderCircle className="mx-auto size-7 animate-spin text-secondary" />
            <p className="mt-3 text-sm text-muted-foreground">{t('customers.loading')}</p>
          </CardContent>
        </Card>
      ) : query.isError ? (
        <ErrorState
          error={query.error}
          title={t('customers.loadFailed')}
          description={t('customers.loadFailedDescription')}
          onRetry={() => void query.refetch()}
        />
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-muted text-secondary">
              {filtered ? <Search /> : <UsersRound />}
            </span>
            <h2 className="mt-4 font-semibold">
              {t(filtered ? 'customers.noMatches' : 'customers.empty')}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t(filtered ? 'customers.noMatchesDescription' : 'customers.emptyDescription')}
            </p>
            {filtered && (
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => {
                  setSearchInput('');
                  setSearch('');
                  setStatus('ACTIVE');
                  setPage(1);
                }}
              >
                {t('customers.clearFilters')}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-start text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 text-start">{t('customers.customer')}</th>
                    <th className="px-5 py-3 text-start">{t('customers.phone')}</th>
                    <th className="px-5 py-3 text-start">{t('customers.preferredBranch')}</th>
                    <th className="px-5 py-3 text-start">{t('customers.status')}</th>
                    <th className="px-5 py-3 text-end">{t('customers.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((customer) => (
                    <tr key={customer.id} className="border-t border-border">
                      <td className="px-5 py-4">
                        <Link
                          className="font-semibold text-primary hover:underline"
                          dir="auto"
                          href={`/dashboard/customers/${customer.id}`}
                        >
                          {customer.name}
                        </Link>
                      </td>
                      <td className="px-5 py-4" dir="ltr">
                        {customer.phone || t('customers.notProvided')}
                      </td>
                      <td className="px-5 py-4" dir="auto">
                        {customer.preferredBranch?.name ?? t('customers.notSet')}
                      </td>
                      <td className="px-5 py-4">
                        <Badge active={customer.isActive} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          {canEdit && (
                            <Button size="sm" variant="outline" onClick={() => openEdit(customer)}>
                              <Pencil className="size-4" />
                              {t('customers.editShort')}
                            </Button>
                          )}
                          {canStatus && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setStatusCustomer(customer)}
                            >
                              {customer.isActive ? (
                                <CircleOff className="size-4" />
                              ) : (
                                <RotateCcw className="size-4" />
                              )}
                              {t(
                                customer.isActive
                                  ? 'customers.deactivateShort'
                                  : 'customers.activateShort',
                              )}
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
          <div className="space-y-3 md:hidden">
            {items.map((customer) => (
              <Card key={customer.id}>
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        className="font-semibold text-primary"
                        dir="auto"
                        href={`/dashboard/customers/${customer.id}`}
                      >
                        {customer.name}
                      </Link>
                      <p className="mt-2 text-sm" dir="ltr">
                        {customer.phone || t('customers.notProvided')}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground" dir="auto">
                        {customer.preferredBranch?.name ?? t('customers.notSet')}
                      </p>
                    </div>
                    <Badge active={customer.isActive} />
                  </div>
                  <div className="mt-4 flex flex-wrap justify-end gap-2">
                    {canEdit && (
                      <Button size="sm" variant="outline" onClick={() => openEdit(customer)}>
                        <Pencil className="size-4" />
                        {t('customers.editShort')}
                      </Button>
                    )}
                    {canStatus && (
                      <Button size="sm" variant="ghost" onClick={() => setStatusCustomer(customer)}>
                        {customer.isActive
                          ? t('customers.deactivateShort')
                          : t('customers.activateShort')}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {meta && meta.pageCount > 1 && (
            <nav className="flex items-center justify-between" aria-label={t('customers.pages')}>
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((value) => value - 1)}
              >
                <ChevronLeft className="size-4 rtl:rotate-180" />
                {t('customers.previous')}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t('customers.page', { page: meta.page, total: meta.pageCount })}
              </span>
              <Button
                variant="outline"
                disabled={page >= meta.pageCount}
                onClick={() => setPage((value) => value + 1)}
              >
                {t('customers.next')}
                <ChevronRight className="size-4 rtl:rotate-180" />
              </Button>
            </nav>
          )}
        </>
      )}
      <CustomerFormDialog
        tenantId={tenantId}
        open={formOpen}
        customer={editing}
        branches={session?.accessibleBranches ?? []}
        defaultBranchId={editing ? '' : (activeBranch?.id ?? '')}
        onOpenChange={setFormOpen}
      />
      <CustomerStatusDialog
        tenantId={tenantId}
        customer={statusCustomer}
        onOpenChange={(open) => {
          if (!open) setStatusCustomer(null);
        }}
      />
    </div>
  );
}
