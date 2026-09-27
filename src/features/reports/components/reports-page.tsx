'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useSession } from '@/providers/session-provider';
import { useProviderReport, useSalonReport, useServiceReport } from '../hooks/use-reports';
import type { ReportRange } from '../types/report';
import { BranchScope, MetricCard, Money, ReportState } from './report-ui';

type Tab = 'salon' | 'providers' | 'services';
const iso = (date: Date) => date.toISOString().slice(0, 10);
const defaults = () => {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 6);
  return { from: iso(from), to: iso(to) };
};

export function ReportsPage() {
  const t = useTranslations('reports');
  const { session, activeBranch } = useSession();
  const [initial] = useState(defaults);
  const [tab, setTab] = useState<Tab>('salon');
  const [branch, setBranch] = useState(activeBranch?.id ?? 'all');
  const [fromDate, setFrom] = useState(initial.from);
  const [toDate, setTo] = useState(initial.to);
  const [providerId, setProvider] = useState('');
  const [categoryId, setCategory] = useState('');
  const [serviceId, setService] = useState('');
  const tenantId = session?.tenant?.id ?? '';
  const currency = session?.tenant?.currencyCode ?? 'USD';
  const range: ReportRange = {
    fromDate,
    toDate,
    ...(branch === 'all' ? { scope: 'all' } : { branchId: branch }),
  };
  const salon = useSalonReport(tenantId, range, tab === 'salon');
  const providers = useProviderReport(
    tenantId,
    { ...range, providerId: providerId || undefined },
    tab === 'providers',
  );
  const services = useServiceReport(
    tenantId,
    {
      ...range,
      categoryId: categoryId || undefined,
      serviceId: serviceId || undefined,
    },
    tab === 'services',
  );
  const active = tab === 'salon' ? salon : tab === 'providers' ? providers : services;
  const dirty =
    branch !== (activeBranch?.id ?? 'all') ||
    fromDate !== initial.from ||
    toDate !== initial.to ||
    providerId ||
    categoryId ||
    serviceId;
  const providerOptions = providers.data?.items ?? [];
  const serviceOptions = services.data?.items ?? [];
  const categories = [
    ...new Map(serviceOptions.map((row) => [row.categoryId, row.categoryName])).entries(),
  ];
  const clear = () => {
    setBranch(activeBranch?.id ?? 'all');
    setFrom(initial.from);
    setTo(initial.to);
    setProvider('');
    setCategory('');
    setService('');
  };
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
      </div>
      <div className="flex gap-2 overflow-x-auto" role="tablist">
        {(['salon', 'providers', 'services'] as Tab[]).map((key) => (
          <Button
            key={key}
            role="tab"
            aria-selected={tab === key}
            variant={tab === key ? 'default' : 'outline'}
            onClick={() => setTab(key)}
          >
            {t(`${key}Performance`)}
          </Button>
        ))}
      </div>
      <Card>
        <CardContent className="grid gap-3 pt-5 sm:grid-cols-2 lg:grid-cols-5">
          <label className="grid gap-1.5 text-sm font-medium">
            <span>{t('from')}</span>
            <Input type="date" value={fromDate} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            <span>{t('to')}</span>
            <Input type="date" value={toDate} onChange={(e) => setTo(e.target.value)} />
          </label>
          <BranchScope
            branches={session?.accessibleBranches ?? []}
            value={branch}
            onChange={setBranch}
          />
          {tab === 'providers' && (
            <Select
              label={t('provider')}
              value={providerId}
              onChange={setProvider}
              all={t('allProviders')}
              options={providerOptions.map((row) => [row.providerId, row.providerName])}
            />
          )}
          {tab === 'services' && (
            <>
              <Select
                label={t('category')}
                value={categoryId}
                onChange={(value) => {
                  setCategory(value);
                  setService('');
                }}
                all={t('allCategories')}
                options={categories}
              />
              <Select
                label={t('service')}
                value={serviceId}
                onChange={setService}
                all={t('allServices')}
                options={serviceOptions
                  .filter((row) => !categoryId || row.categoryId === categoryId)
                  .map((row) => [row.serviceId, row.serviceName])}
              />
            </>
          )}
          {dirty && (
            <Button variant="ghost" className="self-end" onClick={clear}>
              {t('clearFilters')}
            </Button>
          )}
        </CardContent>
      </Card>
      <ReportState loading={active.isLoading} error={active.isError}>
        {tab === 'salon' && salon.data && <Salon data={salon.data} currency={currency} />}
        {tab === 'providers' && providers.data && (
          <ProviderTable rows={providers.data.items} currency={currency} />
        )}
        {tab === 'services' && services.data && (
          <ServiceTable rows={services.data.items} currency={currency} />
        )}
      </ReportState>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  all,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  all: string;
  options: string[][];
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      <span>{label}</span>
      <select
        className="h-10 rounded-lg border border-input bg-background px-3"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{all}</option>
        {options.map(([id, name]) => (
          <option key={id} value={id}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );
}
function Salon({
  data,
  currency,
}: {
  data: NonNullable<ReturnType<typeof useSalonReport>['data']>;
  currency: string;
}) {
  const t = useTranslations('reports');
  const s = data.summary;
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={t('visits')}>{s.visits}</MetricCard>
        <MetricCard label={t('completedVisits')}>{s.completedVisits}</MetricCard>
        <MetricCard label={t('treatmentsCompleted')}>{s.completedTreatments}</MetricCard>
        <MetricCard label={t('revenueRecorded')}>
          <Money value={s.revenueRecorded} currency={currency} />
        </MetricCard>
        <MetricCard label={t('paidVisits')}>{s.paidVisits}</MetricCard>
        <MetricCard label={t('unpaidCompletedVisits')}>{s.unpaidCompletedVisits}</MetricCard>
        <MetricCard label={t('averageVisitValue')}>
          <Money value={s.averageVisitValue} currency={currency} />
        </MetricCard>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('dailyBreakdown')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 md:hidden">
            {data.breakdown.map((row) => (
              <div key={row.date} className="rounded-lg border p-3">
                <strong>{row.date}</strong>
                <p className="mt-2 text-sm">
                  {t('visits')}: {row.visits} · {t('treatments')}: {row.treatments}
                </p>
                <p className="text-sm">
                  <Money value={row.revenue} currency={currency} />
                </p>
              </div>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['date', 'visits', 'treatments', 'revenueRecorded'].map((key) => (
                    <th key={key} className="border-b p-3 text-start font-medium">
                      {t(key)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.breakdown.map((row) => (
                  <tr key={row.date}>
                    <td className="p-3">{row.date}</td>
                    <td className="p-3">{row.visits}</td>
                    <td className="p-3">{row.treatments}</td>
                    <td className="p-3">
                      <Money value={row.revenue} currency={currency} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!data.breakdown.length && <p className="text-sm text-muted-foreground">{t('empty')}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
function ProviderTable({
  rows,
  currency,
}: {
  rows: NonNullable<ReturnType<typeof useProviderReport>['data']>['items'];
  currency: string;
}) {
  const t = useTranslations('reports');
  return (
    <DataCards empty={!rows.length}>
      {rows.map((row) => (
        <Card key={row.providerId}>
          <CardHeader>
            <CardTitle dir="auto">{row.providerName}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <Value label={t('uniqueVisits')} value={row.uniqueVisits} />
            <Value label={t('treatmentsCompleted')} value={row.treatmentsCompleted} />
            <Value
              label={t('revenueHandled')}
              value={<Money value={row.revenueHandled} currency={currency} />}
            />
            <Value
              label={t('averageTreatmentValue')}
              value={<Money value={row.averageTreatmentValue} currency={currency} />}
            />
            <Value label={t('cancelledTreatments')} value={row.cancelledTreatments} />
            <Value label={t('mostPerformedTreatment')} value={row.mostPerformedTreatment ?? '—'} />
          </CardContent>
        </Card>
      ))}
    </DataCards>
  );
}
function ServiceTable({
  rows,
  currency,
}: {
  rows: NonNullable<ReturnType<typeof useServiceReport>['data']>['items'];
  currency: string;
}) {
  const t = useTranslations('reports');
  return (
    <DataCards empty={!rows.length}>
      {rows.map((row) => (
        <Card key={`${row.serviceId}-${row.serviceName}`}>
          <CardHeader>
            <CardTitle dir="auto">{row.serviceName}</CardTitle>
            <p className="text-sm text-muted-foreground" dir="auto">
              {row.categoryName}
            </p>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <Value label={t('treatmentsCompleted')} value={row.treatmentsCompleted} />
            <Value label={t('uniqueVisits')} value={row.uniqueVisits} />
            <Value
              label={t('revenueHandled')}
              value={<Money value={row.revenueHandled} currency={currency} />}
            />
            <Value
              label={t('averageTreatmentValue')}
              value={<Money value={row.averageTreatmentValue} currency={currency} />}
            />
          </CardContent>
        </Card>
      ))}
    </DataCards>
  );
}
function DataCards({ empty, children }: { empty: boolean; children: React.ReactNode }) {
  const t = useTranslations('reports');
  return empty ? (
    <div className="rounded-xl border p-8 text-center text-muted-foreground">{t('empty')}</div>
  ) : (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div>
  );
}
function Value({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold" dir="auto">
        {value}
      </p>
    </div>
  );
}
