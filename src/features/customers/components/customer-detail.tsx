'use client';
import Link from 'next/link';
import { ArrowLeft, CircleOff, LoaderCircle, Pencil, RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ErrorState } from '@/components/feedback/error-state';
import { ApiError } from '@/lib/api/error';
import { permissions } from '@/lib/permissions/permissions';
import { cn } from '@/lib/utils';
import { usePermissions, useSession } from '@/providers/session-provider';
import { useCustomer } from '../hooks/use-customers';
import { CustomerFormDialog } from './customer-form-dialog';
import { CustomerStatusDialog } from './customer-status-dialog';

export function CustomerDetail({ customerId }: { customerId: string }) {
  const t = useTranslations();
  const { session } = useSession();
  const { can } = usePermissions();
  const tenantId = session?.tenant?.id ?? '';
  const canView = can(permissions.customerRead);
  const [editOpen, setEditOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const query = useCustomer(tenantId, customerId, canView);
  if (!canView || !tenantId)
    return (
      <Card role="alert">
        <CardContent className="pt-6">
          <h1 className="text-lg font-semibold">{t('unauthorized.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('unauthorized.description')}</p>
        </CardContent>
      </Card>
    );
  if (query.isLoading)
    return (
      <Card role="status">
        <CardContent className="py-14 text-center">
          <LoaderCircle className="mx-auto size-7 animate-spin text-secondary" />
          <p className="mt-3 text-muted-foreground">{t('customers.loadingProfile')}</p>
        </CardContent>
      </Card>
    );
  if (query.isError) {
    const missing = query.error instanceof ApiError && query.error.status === 404;
    return (
      <ErrorState
        error={query.error}
        title={t(missing ? 'customers.notFound' : 'customers.profileLoadFailed')}
        description={t(
          missing ? 'customers.notFoundDescription' : 'customers.loadFailedDescription',
        )}
        onRetry={missing ? undefined : () => void query.refetch()}
      />
    );
  }
  const customer = query.data!;
  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/customers"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" />
        {t('customers.back')}
      </Link>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-secondary">{t('customers.profile')}</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-semibold" dir="auto">
              {customer.name}
            </h1>
            <span
              className={cn(
                'rounded-full px-2.5 py-1 text-xs font-semibold',
                customer.isActive ? 'bg-success/12 text-success' : 'bg-muted text-muted-foreground',
              )}
            >
              {t(customer.isActive ? 'customers.active' : 'customers.inactive')}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {can(permissions.customerUpdate) && (
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" />
              {t('customers.edit')}
            </Button>
          )}
          {can(permissions.customerDeactivate) && (
            <Button
              variant={customer.isActive ? 'ghost' : 'default'}
              onClick={() => setStatusOpen(true)}
            >
              {customer.isActive ? (
                <CircleOff className="size-4" />
              ) : (
                <RotateCcw className="size-4" />
              )}
              {t(customer.isActive ? 'customers.deactivate' : 'customers.activate')}
            </Button>
          )}
        </div>
      </header>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <h2 className="font-display text-xl font-semibold">{t('customers.contactDetails')}</h2>
            <dl className="mt-5 space-y-4">
              <div>
                <dt className="text-sm text-muted-foreground">{t('customers.phone')}</dt>
                <dd className="mt-1 font-medium" dir="ltr">
                  {customer.phone || t('customers.notProvided')}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">{t('customers.preferredBranch')}</dt>
                <dd className="mt-1 font-medium" dir="auto">
                  {customer.preferredBranch?.name ?? t('customers.notSet')}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <h2 className="font-display text-xl font-semibold">{t('customers.notes')}</h2>
            <p
              className="mt-5 whitespace-pre-wrap text-sm leading-6 text-muted-foreground"
              dir="auto"
            >
              {customer.notes || t('customers.noNotes')}
            </p>
          </CardContent>
        </Card>
      </div>
      <CustomerFormDialog
        tenantId={tenantId}
        open={editOpen}
        customer={customer}
        branches={session?.accessibleBranches ?? []}
        defaultBranchId=""
        onOpenChange={setEditOpen}
      />
      <CustomerStatusDialog
        tenantId={tenantId}
        customer={statusOpen ? customer : null}
        onOpenChange={setStatusOpen}
      />
    </div>
  );
}
