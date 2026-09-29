'use client';

import { useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  ArrowUpRight,
  Award,
  CalendarDays,
  CircleDollarSign,
  RotateCcw,
  Scissors,
  Sparkles,
  Star,
  UsersRound,
  WalletCards,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ProviderAvatar } from '@/features/service-providers/components/provider-avatar';
import { cn } from '@/lib/utils';
import { useSession } from '@/providers/session-provider';
import { useProviderReport, useSalonReport, useServiceReport } from '../hooks/use-reports';
import type { ProviderPerformanceRow, ReportRange, ServicePerformanceRow } from '../types/report';
import { BranchScope, Money, ReportState } from './report-ui';

type Tab = 'salon' | 'providers' | 'services';
type DatePreset = 'today' | 'yesterday' | 'thisMonth';
type Sort = 'revenue' | 'treatments' | 'average';
type KpiDecorationVariant = 'revenue' | 'visits' | 'treatments';
const colors = ['#552044', '#9f4868', '#d68798', '#ebbdc5', '#f4dadd'];
const iso = (date: Date) => date.toISOString().slice(0, 10);
const amount = (value: string | null) => Number(value ?? 0) || 0;
const defaults = () => {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 6);
  return { from: iso(from), to: iso(to) };
};

function currentDate(timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}
function presetRange(preset: DatePreset, timeZone: string) {
  const today = currentDate(timeZone);
  if (preset === 'today') return { from: today, to: today };
  if (preset === 'thisMonth') return { from: `${today.slice(0, 7)}-01`, to: today };
  const yesterday = new Date(`${today}T00:00:00Z`);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  return { from: iso(yesterday), to: iso(yesterday) };
}

export function ReportsPage() {
  const t = useTranslations('reports');
  const { session, activeBranch } = useSession();
  const [initial] = useState(defaults);
  const [tab, setTab] = useState<Tab>('salon');
  const [branch, setBranch] = useState(activeBranch?.id ?? 'all');
  const [fromDate, setFrom] = useState(initial.from);
  const [toDate, setTo] = useState(initial.to);
  const [datePreset, setDatePreset] = useState<DatePreset | null>(null);
  const [providerId, setProvider] = useState('');
  const [categoryId, setCategory] = useState('');
  const [serviceId, setService] = useState('');
  const tenantId = session?.tenant?.id ?? '';
  const currency = session?.tenant?.currencyCode ?? 'USD';
  const zone = (id: string) =>
    id === 'all'
      ? (session?.tenant?.timezone ?? 'UTC')
      : (session?.accessibleBranches.find((item) => item.id === id)?.timezone ??
        session?.tenant?.timezone ??
        'UTC');
  const applyPreset = (preset: DatePreset, timeZone = zone(branch)) => {
    const next = presetRange(preset, timeZone);
    setDatePreset(preset);
    setFrom(next.from);
    setTo(next.to);
  };
  const changeBranch = (id: string) => {
    setBranch(id);
    if (datePreset) applyPreset(datePreset, zone(id));
  };
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
    { ...range, categoryId: categoryId || undefined, serviceId: serviceId || undefined },
    tab === 'services',
  );
  const active = tab === 'salon' ? salon : tab === 'providers' ? providers : services;
  const providerOptions = providers.data?.items ?? [];
  const serviceOptions = services.data?.items ?? [];
  const categories = [
    ...new Map(serviceOptions.map((row) => [row.categoryId, row.categoryName])).entries(),
  ];
  const clear = () => {
    setBranch(activeBranch?.id ?? 'all');
    setFrom(initial.from);
    setTo(initial.to);
    setDatePreset(null);
    setProvider('');
    setCategory('');
    setService('');
  };

  return (
    <div className="space-y-5 lg:space-y-6">
      <section className="relative -mx-4 -mt-4 min-h-44 overflow-hidden px-4 pt-8 sm:-mx-6 sm:-mt-6 sm:px-6 lg:-mx-8 lg:-mt-8 lg:min-h-52 lg:px-8 lg:pt-10">
        <div
          className="absolute inset-y-0 end-0 w-full bg-cover bg-[position:70%_center] opacity-75 sm:w-[72%] lg:w-[66%] rtl:-scale-x-100"
          style={{ backgroundImage: "url('/images/reports/reports-header.png')" }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/10 rtl:bg-gradient-to-l" />
        <div className="relative min-w-0">
          <div className="max-w-xl">
            <h1 className="font-display text-4xl font-semibold tracking-tight text-primary lg:text-5xl">
              {t('title')}
            </h1>
            <p className="mt-1.5 text-base text-muted-foreground sm:text-lg">{t('description')}</p>
          </div>
          <div className="mt-5 flex gap-2 overflow-x-auto pb-2" role="tablist">
            {(['salon', 'providers', 'services'] as Tab[]).map((key) => (
              <button
                key={key}
                role="tab"
                aria-selected={tab === key}
                className={cn(
                  'focus-ring shrink-0 rounded-xl border px-5 py-2.5 text-sm font-semibold transition-colors',
                  tab === key
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                    : 'border-border bg-card/90 text-foreground hover:bg-muted',
                )}
                onClick={() => setTab(key)}
              >
                {t(`${key}Performance`)}
              </button>
            ))}
          </div>
        </div>
      </section>
      <Card className="relative z-10 bg-card/95 p-4 backdrop-blur-sm sm:p-5">
        <div
          className={cn(
            'grid items-end gap-4 md:grid-cols-2 xl:gap-3',
            tab === 'salon' &&
              'xl:grid-cols-[minmax(280px,1.45fr)_auto_minmax(145px,1fr)_minmax(145px,1fr)_minmax(180px,1.15fr)_auto_auto]',
            tab === 'providers' &&
              'xl:grid-cols-[max-content_auto_minmax(145px,1fr)_minmax(145px,1fr)_minmax(170px,1.1fr)_minmax(170px,1.1fr)_auto_auto]',
            tab === 'services' &&
              'xl:grid-cols-[max-content_auto_minmax(135px,.9fr)_minmax(135px,.9fr)_minmax(155px,1fr)_minmax(145px,1fr)_minmax(145px,1fr)_auto_auto]',
          )}
        >
          <div className="space-y-2 md:col-span-2 xl:col-span-1 xl:min-w-max">
            <span className="text-sm font-semibold">{t('quickRange')}</span>
            <div className="flex flex-wrap gap-2 xl:flex-nowrap">
              {(['today', 'yesterday', 'thisMonth'] as DatePreset[]).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={cn(
                    'focus-ring rounded-full border px-4 py-2 text-sm transition-colors',
                    datePreset === preset
                      ? 'border-accent/30 bg-muted font-semibold text-secondary'
                      : 'border-border bg-background hover:bg-muted/60',
                  )}
                  aria-pressed={datePreset === preset}
                  onClick={() => applyPreset(preset)}
                >
                  {t(preset)}
                </button>
              ))}
            </div>
          </div>
          <FilterDivider />
          <DateField
            label={t('from')}
            value={fromDate}
            onChange={setFrom}
            clearPreset={() => setDatePreset(null)}
          />
          <DateField
            label={t('to')}
            value={toDate}
            onChange={setTo}
            clearPreset={() => setDatePreset(null)}
          />
          <BranchScope
            branches={session?.accessibleBranches ?? []}
            value={branch}
            onChange={changeBranch}
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
          )}
          {tab === 'services' && (
            <Select
              label={t('service')}
              value={serviceId}
              onChange={setService}
              all={t('allServices')}
              options={serviceOptions
                .filter((row) => !categoryId || row.categoryId === categoryId)
                .map((row) => [row.serviceId, row.serviceName])}
            />
          )}
          <FilterDivider />
          <Button
            variant="ghost"
            className="justify-self-start gap-2 whitespace-nowrap text-secondary xl:justify-self-end"
            onClick={clear}
          >
            <RotateCcw className="size-4" />
            {t('clearFilters')}
          </Button>
        </div>
      </Card>
      <ReportState loading={active.isLoading} error={active.isError}>
        {tab === 'salon' && salon.data && <Salon data={salon.data} currency={currency} />}
        {tab === 'providers' && providers.data && (
          <Providers rows={providers.data.items} currency={currency} />
        )}
        {tab === 'services' && services.data && (
          <Services rows={services.data.items} currency={currency} />
        )}
      </ReportState>
    </div>
  );
}

function FilterDivider() {
  return (
    <span className="hidden h-12 self-end border-s border-border xl:block" aria-hidden="true" />
  );
}

function DateField({
  label,
  value,
  onChange,
  clearPreset,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  clearPreset: () => void;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      <span>{label}</span>
      <Input
        type="date"
        value={value}
        onChange={(event) => {
          clearPreset();
          onChange(event.target.value);
        }}
      />
    </label>
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
        className="h-10 min-w-0 rounded-lg border border-input bg-background px-3"
        value={value}
        onChange={(event) => onChange(event.target.value)}
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
function Kpi({
  icon: Icon,
  label,
  children,
  support,
  decoration,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  children: ReactNode;
  support?: ReactNode;
  decoration?: KpiDecorationVariant;
}) {
  return (
    <Card
      className={cn(
        'relative overflow-hidden p-5',
        decoration && 'bg-gradient-to-l from-muted/30 via-card to-card rtl:bg-gradient-to-r',
      )}
    >
      <div className="absolute -bottom-8 -end-6 size-28 rounded-full bg-muted/55 blur-2xl" />
      {decoration && <KpiCardDecoration variant={decoration} />}
      <div className="relative z-10 flex items-center gap-4">
        <span className="grid size-14 shrink-0 place-items-center rounded-full bg-muted text-secondary">
          <Icon className="size-6" />
        </span>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-primary">
            {children}
          </p>
          {support && <p className="mt-1 text-xs text-muted-foreground">{support}</p>}
        </div>
      </div>
    </Card>
  );
}

function KpiCardDecoration({ variant }: { variant: KpiDecorationVariant }) {
  const paths: Record<KpiDecorationVariant, string[]> = {
    revenue: [
      'M4 66 C30 58 42 72 66 54 S104 38 124 24 S150 22 176 8',
      'M8 78 C38 66 52 76 78 60 S116 47 138 32 S158 27 180 18',
    ],
    visits: [
      'M4 70 C26 50 48 64 68 48 S102 58 122 35 S154 34 178 12',
      'M6 80 C32 65 50 72 72 58 S105 65 128 44 S158 43 180 24',
    ],
    treatments: [
      'M4 72 C24 68 38 48 58 54 S88 68 108 44 S142 42 178 10',
      'M6 82 C28 77 42 61 62 66 S91 76 114 55 S147 51 180 28',
    ],
  };

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 184 88"
      fill="none"
      className="pointer-events-none absolute end-2 top-1/2 hidden h-auto w-[clamp(8rem,34%,11rem)] -translate-y-1/2 text-secondary opacity-[0.18] min-[420px]:block"
    >
      {paths[variant].map((path, index) => (
        <path
          key={path}
          d={path}
          stroke="currentColor"
          strokeWidth={index === 0 ? 2.25 : 1.5}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}
function Heading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border/70 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="font-display text-xl font-semibold text-primary">{title}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
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
  const locale = useLocale();
  const s = data.summary;
  const maxRevenue = Math.max(...data.breakdown.map((row) => amount(row.revenue)), 1);
  const strongest = [...data.breakdown].sort((a, b) => amount(b.revenue) - amount(a.revenue))[0];
  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <Kpi
          icon={WalletCards}
          label={t('revenueRecorded')}
          support={t('selectedPeriod')}
          decoration="revenue"
        >
          <Money value={s.revenueRecorded} currency={currency} />
        </Kpi>
        <Kpi
          icon={CalendarDays}
          label={t('completedVisits')}
          support={t('ofTotalVisits', { total: s.visits })}
          decoration="visits"
        >
          {s.completedVisits}
        </Kpi>
        <Kpi
          icon={Sparkles}
          label={t('treatmentsCompleted')}
          support={t('selectedPeriod')}
          decoration="treatments"
        >
          {s.completedTreatments}
        </Kpi>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.65fr_1fr]">
        <Card className="overflow-hidden">
          <Heading title={t('dailyPerformance')} description={t('dailyPerformanceDescription')} />
          <div className="p-5">
            {data.breakdown.length ? (
              <div className="flex h-64 items-end gap-2 sm:gap-3">
                {data.breakdown.map((row) => (
                  <div
                    key={row.date}
                    className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-2"
                  >
                    <span className="hidden text-xs font-semibold text-secondary group-hover:block">
                      <Money value={row.revenue} currency={currency} />
                    </span>
                    <div
                      className="w-full max-w-14 rounded-t-lg bg-gradient-to-t from-primary to-accent"
                      style={{
                        height: `${Math.max(8, (amount(row.revenue) / maxRevenue) * 180)}px`,
                      }}
                      title={`${row.date}: ${row.revenue}`}
                    />
                    <span className="max-w-full truncate text-[10px] text-muted-foreground sm:text-xs">
                      {new Intl.DateTimeFormat(locale, {
                        month: 'short',
                        day: 'numeric',
                        timeZone: 'UTC',
                      }).format(new Date(`${row.date}T00:00:00Z`))}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <Empty />
            )}
          </div>
        </Card>
        <Card className="overflow-hidden">
          <Heading title={t('visitStatus')} description={t('visitStatusDescription')} />
          <div className="space-y-5 p-5">
            <Progress
              label={t('paidVisits')}
              value={s.paidVisits}
              percent={s.completedVisits ? (s.paidVisits / s.completedVisits) * 100 : 0}
            />
            <Progress
              label={t('unpaidCompletedVisits')}
              value={s.unpaidCompletedVisits}
              percent={s.completedVisits ? (s.unpaidCompletedVisits / s.completedVisits) * 100 : 0}
              rose
            />
            <div className="grid grid-cols-2 gap-3 border-t pt-4">
              <Mini label={t('averageVisitValue')}>
                <Money value={s.averageVisitValue} currency={currency} />
              </Mini>
              <Mini label={t('visits')}>{s.visits}</Mini>
            </div>
          </div>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Insight
          icon={Award}
          label={t('highestRevenueDay')}
          value={
            strongest
              ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(
                  new Date(`${strongest.date}T00:00:00Z`),
                )
              : '—'
          }
          detail={strongest ? <Money value={strongest.revenue} currency={currency} /> : t('empty')}
        />
        <Insight
          icon={CircleDollarSign}
          label={t('averageVisitValue')}
          value={<Money value={s.averageVisitValue} currency={currency} />}
          detail={t('completedVisitAverage')}
        />
      </div>
    </div>
  );
}

function Providers({ rows, currency }: { rows: ProviderPerformanceRow[]; currency: string }) {
  const t = useTranslations('reports');
  const [sort, setSort] = useState<Sort>('revenue');
  const total = rows.reduce((sum, row) => sum + amount(row.revenueHandled), 0);
  const treatments = rows.reduce((sum, row) => sum + row.treatmentsCompleted, 0);
  const sorted = useMemo(
    () =>
      [...rows].sort((a, b) =>
        sort === 'treatments'
          ? b.treatmentsCompleted - a.treatmentsCompleted
          : sort === 'average'
            ? amount(b.averageTreatmentValue) - amount(a.averageTreatmentValue)
            : amount(b.revenueHandled) - amount(a.revenueHandled),
      ),
    [rows, sort],
  );
  const top = [...rows].sort((a, b) => amount(b.revenueHandled) - amount(a.revenueHandled))[0];
  const treatment = rows
    .filter((row) => row.mostPerformedTreatment)
    .sort((a, b) => b.treatmentsCompleted - a.treatmentsCompleted)[0];
  if (!rows.length) return <Empty />;
  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <Kpi
          icon={WalletCards}
          label={t('revenueHandled')}
          support={t('selectedPeriod')}
          decoration="revenue"
        >
          <Money value={String(total)} currency={currency} />
        </Kpi>
        <Kpi
          icon={CalendarDays}
          label={t('treatmentsCompleted')}
          support={t('acrossProviders', { count: rows.length })}
          decoration="treatments"
        >
          {treatments}
        </Kpi>
        <Kpi
          icon={UsersRound}
          label={t('activeProviders')}
          support={t('withRecordedActivity')}
          decoration="visits"
        >
          {rows.length}
        </Kpi>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <Card className="overflow-hidden">
          <Heading
            title={t('topProviderPerformance')}
            description={t('topProviderPerformanceDescription')}
            action={<SortSelect value={sort} onChange={(value) => setSort(value as Sort)} />}
          />
          <div className="overflow-x-auto p-5 pt-2">
            <div className="min-w-[720px]">
              <div className="grid grid-cols-[1.45fr_.8fr_.7fr_1fr_1.2fr] gap-4 border-b py-3 text-xs font-semibold text-muted-foreground">
                <span>{t('provider')}</span>
                <span>{t('revenueHandled')}</span>
                <span>{t('treatments')}</span>
                <span>{t('averageTreatmentValue')}</span>
                <span>{t('revenueShare')}</span>
              </div>
              {sorted.map((row, index) => {
                const share = total ? (amount(row.revenueHandled) / total) * 100 : 0;
                return (
                  <div
                    key={row.providerId}
                    className="grid grid-cols-[1.45fr_.8fr_.7fr_1fr_1.2fr] items-center gap-4 border-b border-border/60 py-3 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <ProviderAvatar name={row.providerName} photoUrl={null} />
                      <div className="min-w-0">
                        <p className="truncate font-display font-semibold" dir="auto">
                          {row.providerName}
                        </p>
                        {index === 0 && (
                          <p className="text-xs font-medium text-success">{t('topPerformer')}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-semibold">
                      <Money value={row.revenueHandled} currency={currency} />
                    </span>
                    <span className="text-sm">{row.treatmentsCompleted}</span>
                    <span className="text-sm">
                      <Money value={row.averageTreatmentValue} currency={currency} />
                    </span>
                    <div>
                      <span className="text-xs">{share.toFixed(1)}%</span>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-secondary to-accent"
                          style={{ width: `${share}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
        <ShareChart
          title={t('revenueByProvider')}
          totalLabel={t('revenueHandled')}
          total={total}
          currency={currency}
          entries={rows.map((row) => ({
            id: row.providerId,
            name: row.providerName,
            value: amount(row.revenueHandled),
          }))}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Insight
          icon={Award}
          label={t('highestRevenueProvider')}
          value={top?.providerName ?? '—'}
          detail={
            top ? (
              <>
                <Money value={top.revenueHandled} currency={currency} /> ·{' '}
                {total ? ((amount(top.revenueHandled) / total) * 100).toFixed(1) : 0}%
              </>
            ) : (
              t('empty')
            )
          }
        />
        <Insight
          icon={Star}
          label={t('mostPerformedTreatment')}
          value={treatment?.mostPerformedTreatment ?? '—'}
          detail={treatment ? t('providedBy', { name: treatment.providerName }) : t('empty')}
        />
      </div>
    </div>
  );
}

function Services({ rows, currency }: { rows: ServicePerformanceRow[]; currency: string }) {
  const t = useTranslations('reports');
  const [sort, setSort] = useState<Sort>('revenue');
  const total = rows.reduce((sum, row) => sum + amount(row.revenueHandled), 0);
  const treatments = rows.reduce((sum, row) => sum + row.treatmentsCompleted, 0);
  const sorted = useMemo(
    () =>
      [...rows].sort((a, b) =>
        sort === 'treatments'
          ? b.treatmentsCompleted - a.treatmentsCompleted
          : sort === 'average'
            ? amount(b.averageTreatmentValue) - amount(a.averageTreatmentValue)
            : amount(b.revenueHandled) - amount(a.revenueHandled),
      ),
    [rows, sort],
  );
  const top = [...rows].sort((a, b) => b.treatmentsCompleted - a.treatmentsCompleted)[0];
  if (!rows.length) return <Empty />;
  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <Kpi
          icon={WalletCards}
          label={t('revenueHandled')}
          support={t('selectedPeriod')}
          decoration="revenue"
        >
          <Money value={String(total)} currency={currency} />
        </Kpi>
        <Kpi
          icon={Scissors}
          label={t('treatmentsCompleted')}
          support={t('acrossServices', { count: rows.length })}
          decoration="treatments"
        >
          {treatments}
        </Kpi>
        <Kpi
          icon={Sparkles}
          label={t('activeCategories')}
          support={t('withRecordedActivity')}
          decoration="visits"
        >
          {new Set(rows.map((row) => row.categoryId)).size}
        </Kpi>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <Card className="overflow-hidden">
          <Heading
            title={t('topServicePerformance')}
            description={t('topServicePerformanceDescription')}
            action={<SortSelect value={sort} onChange={(value) => setSort(value as Sort)} />}
          />
          <div className="overflow-x-auto p-5 pt-2">
            <div className="min-w-[700px]">
              <div className="grid grid-cols-[1.4fr_1fr_.75fr_1fr_1fr] gap-4 border-b py-3 text-xs font-semibold text-muted-foreground">
                <span>{t('service')}</span>
                <span>{t('category')}</span>
                <span>{t('treatments')}</span>
                <span>{t('revenueHandled')}</span>
                <span>{t('averageTreatmentValue')}</span>
              </div>
              {sorted.map((row, index) => (
                <div
                  key={`${row.serviceId}-${row.serviceName}`}
                  className="grid grid-cols-[1.4fr_1fr_.75fr_1fr_1fr] items-center gap-4 border-b border-border/60 py-4 text-sm last:border-0"
                >
                  <div>
                    <p className="font-display font-semibold" dir="auto">
                      {row.serviceName}
                    </p>
                    {index === 0 && (
                      <p className="text-xs font-medium text-success">{t('topPerformer')}</p>
                    )}
                  </div>
                  <span dir="auto">{row.categoryName}</span>
                  <span>{row.treatmentsCompleted}</span>
                  <span className="font-semibold">
                    <Money value={row.revenueHandled} currency={currency} />
                  </span>
                  <span>
                    <Money value={row.averageTreatmentValue} currency={currency} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
        <ShareChart
          title={t('revenueByService')}
          totalLabel={t('revenueHandled')}
          total={total}
          currency={currency}
          entries={rows.map((row) => ({
            id: row.serviceId,
            name: row.serviceName,
            value: amount(row.revenueHandled),
          }))}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Insight
          icon={Star}
          label={t('mostPerformedService')}
          value={top?.serviceName ?? '—'}
          detail={top ? t('treatmentsCount', { count: top.treatmentsCompleted }) : t('empty')}
        />
        <Insight
          icon={Award}
          label={t('highestRevenueService')}
          value={sorted[0]?.serviceName ?? '—'}
          detail={
            sorted[0] ? <Money value={sorted[0].revenueHandled} currency={currency} /> : t('empty')
          }
        />
      </div>
    </div>
  );
}

function ShareChart({
  title,
  totalLabel,
  total,
  currency,
  entries,
}: {
  title: string;
  totalLabel: string;
  total: number;
  currency: string;
  entries: Array<{ id: string; name: string; value: number }>;
}) {
  const t = useTranslations('reports');
  const visible = [...entries].sort((a, b) => b.value - a.value).slice(0, 4);
  const remainder = total - visible.reduce((sum, item) => sum + item.value, 0);
  const items =
    remainder > 0 ? [...visible, { id: 'others', name: t('others'), value: remainder }] : visible;
  let offset = 0;
  const gradient = total
    ? items
        .map((item, index) => {
          const start = offset;
          offset += (item.value / total) * 100;
          return `${colors[index]} ${start}% ${offset}%`;
        })
        .join(', ')
    : 'var(--muted) 0 100%';
  return (
    <Card className="overflow-hidden">
      <Heading title={title} description={t('shareOfTotalRevenue')} />
      <div className="grid gap-6 p-5 sm:grid-cols-[180px_1fr] sm:items-center xl:grid-cols-1 2xl:grid-cols-[180px_1fr]">
        <div
          className="relative mx-auto size-44 rounded-full"
          style={{ background: `conic-gradient(${gradient})` }}
          role="img"
          aria-label={t('shareOfTotalRevenue')}
        >
          <div className="absolute inset-8 grid place-content-center rounded-full bg-card text-center">
            <strong className="font-display text-lg">
              <Money value={String(total)} currency={currency} />
            </strong>
            <span className="mt-1 text-[11px] text-muted-foreground">{totalLabel}</span>
          </div>
        </div>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={item.id} className="flex items-start gap-2.5">
              <span
                className="mt-1 size-3 shrink-0 rounded-full"
                style={{ backgroundColor: colors[index] }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex gap-2 text-sm">
                  <span className="min-w-0 flex-1 truncate" dir="auto">
                    {item.name}
                  </span>
                  <strong>{total ? ((item.value / total) * 100).toFixed(1) : 0}%</strong>
                </div>
                <p className="text-xs text-muted-foreground">
                  <Money value={String(item.value)} currency={currency} />
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function Progress({
  label,
  value,
  percent,
  rose,
}: {
  label: string;
  value: number;
  percent: number;
  rose?: boolean;
}) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full', rose ? 'bg-accent' : 'bg-primary')}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
    </div>
  );
}
function Mini({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-lg font-semibold">{children}</p>
    </div>
  );
}
function Insight({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: ReactNode;
  detail: ReactNode;
}) {
  return (
    <Card className="relative overflow-hidden border-accent/25 bg-gradient-to-br from-card to-muted/70 p-5">
      <Sparkles className="absolute -bottom-5 -end-3 size-28 text-accent/10" />
      <div className="relative flex items-center gap-4">
        <span className="grid size-14 shrink-0 place-items-center rounded-full bg-background text-secondary">
          <Icon className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-0.5 truncate font-display text-xl font-semibold text-primary" dir="auto">
            {value}
          </p>
          <p className="mt-1 text-sm text-muted-foreground" dir="auto">
            {detail}
          </p>
        </div>
        <ArrowUpRight className="size-5 text-secondary rtl:-scale-x-100" />
      </div>
    </Card>
  );
}
function SortSelect({ value, onChange }: { value: Sort; onChange: (value: string) => void }) {
  const t = useTranslations('reports');
  return (
    <select
      className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="revenue">{t('sortByRevenue')}</option>
      <option value="treatments">{t('sortByTreatments')}</option>
      <option value="average">{t('sortByAverageValue')}</option>
    </select>
  );
}
function Empty() {
  const t = useTranslations('reports');
  return (
    <div className="rounded-xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">
      {t('empty')}
    </div>
  );
}
