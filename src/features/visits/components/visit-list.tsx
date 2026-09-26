'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, CalendarRange, Clock3, Eye, Pencil, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { queryKeys } from '@/lib/api/query-client';
import { useActiveBranch, useCurrentTenant } from '@/providers/session-provider';
import { listVisits } from '../api/visits-api';
import type { VisitStatus } from '../types/visit';
import { formatMoney } from '../lib/money';

function dayBounds(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  return { dateFrom: start.toISOString(), dateTo: end.toISOString() };
}

export function VisitListScreen() {
  const t = useTranslations('visits');
  const tenant = useCurrentTenant();
  const { activeBranch } = useActiveBranch();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<VisitStatus | ''>('');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'RANGE'>('TODAY');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const dates =
    dateFilter === 'TODAY'
      ? dayBounds(0)
      : dateFilter === 'YESTERDAY'
        ? dayBounds(-1)
        : dateFilter === 'RANGE'
          ? {
              ...(dateFrom ? { dateFrom: new Date(`${dateFrom}T00:00:00`).toISOString() } : {}),
              ...(dateTo ? { dateTo: new Date(`${dateTo}T23:59:59.999`).toISOString() } : {}),
            }
          : {};
  const params = { page: 1, pageSize: 50, search, ...dates, ...(status ? { status } : {}) };
  const query = useQuery({
    queryKey: queryKeys.visitList(tenant?.id ?? '', activeBranch?.id ?? '', params),
    queryFn: ({ signal }) => listVisits(activeBranch!.id, params, signal),
    enabled: Boolean(tenant && activeBranch),
  });
  if (!activeBranch) return <Card className="p-6">{t('selectBranch')}</Card>;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold">{t('visits')}</h1>
        <Button asChild>
          <Link href="/dashboard/pos">
            <Plus className="size-4" />
            {t('newVisit')}
          </Link>
        </Button>
      </div>
      <Card className="p-4">
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchCustomer')}
          />
          <select
            className="h-10 rounded-md border bg-background px-3"
            value={status}
            onChange={(e) => setStatus(e.target.value as VisitStatus | '')}
          >
            <option value="">{t('status')}</option>
            {['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((value) => (
              <option key={value} value={value}>
                {t(`statuses.${value}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4 flex flex-wrap items-end gap-2">
          <Button
            size="sm"
            variant={dateFilter === 'TODAY' ? 'default' : 'outline'}
            onClick={() => setDateFilter('TODAY')}
          >
            <CalendarDays className="size-4" />
            {t('today')}
          </Button>
          <Button
            size="sm"
            variant={dateFilter === 'YESTERDAY' ? 'default' : 'outline'}
            onClick={() => setDateFilter('YESTERDAY')}
          >
            <Clock3 className="size-4" />
            {t('yesterday')}
          </Button>
          <Button
            size="sm"
            variant={dateFilter === 'RANGE' ? 'default' : 'outline'}
            onClick={() => setDateFilter('RANGE')}
          >
            <CalendarRange className="size-4" />
            {t('dateRange')}
          </Button>
          <Button
            size="sm"
            variant={dateFilter === 'ALL' ? 'default' : 'outline'}
            onClick={() => setDateFilter('ALL')}
          >
            <CalendarDays className="size-4" />
            {t('allDates')}
          </Button>
          {dateFilter === 'RANGE' && (
            <>
              <label className="text-sm">
                {t('dateFrom')}
                <Input
                  className="mt-1"
                  type="date"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                />
              </label>
              <label className="text-sm">
                {t('dateTo')}
                <Input
                  className="mt-1"
                  type="date"
                  value={dateTo}
                  onChange={(event) => setDateTo(event.target.value)}
                />
              </label>
            </>
          )}
        </div>
        {query.isLoading ? (
          <p>{t('loading')}</p>
        ) : !query.data?.items.length ? (
          <p className="py-10 text-center text-muted-foreground">{t('noVisits')}</p>
        ) : (
          <div className="grid gap-3">
            {query.data.items.map((visit) => (
              <div
                key={visit.id}
                className="grid gap-3 rounded-xl border p-4 sm:grid-cols-[1fr_auto_auto_auto_auto] sm:items-center"
              >
                <div>
                  <strong>{visit.customer.name}</strong>
                  <span className="block text-sm text-muted-foreground">
                    {visit.customer.phone}
                  </span>
                </div>
                <span>
                  {visit.items.length} {t('treatmentCount')}
                </span>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                  {t(`statuses.${visit.status}`)}
                </span>
                <strong>
                  {formatMoney(visit.total)} {tenant?.currencyCode}
                </strong>
                <div className="flex gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/visits/${visit.id}`}>
                      <Eye className="size-4" />
                      {t('view')}
                    </Link>
                  </Button>
                  {['DRAFT', 'IN_PROGRESS'].includes(visit.status) && (
                    <Button asChild size="sm">
                      <Link href={`/dashboard/pos?visitId=${visit.id}`}>
                        <Pencil className="size-4" />
                        {t('editVisit')}
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
