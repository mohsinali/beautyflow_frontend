'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  CheckCircle2,
  CircleCheckBig,
  CirclePlay,
  Clock3,
  Hourglass,
  LoaderCircle,
  MapPin,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getMyWork, transitionVisitItem } from '@/features/visits/api/visits-api';
import type { ProviderWorkItem, VisitItemStatus } from '@/features/visits/types/visit';
import { ApiError } from '@/lib/api/error';
import { queryKeys } from '@/lib/api/query-client';
import { useSession } from '@/providers/session-provider';

const statusOrder: Record<VisitItemStatus, number> = {
  IN_PROGRESS: 0,
  PENDING: 1,
  COMPLETED: 2,
  CANCELLED: 3,
};

const statusStyles: Record<VisitItemStatus, string> = {
  PENDING: 'bg-accent/20 text-primary',
  IN_PROGRESS: 'bg-warning/15 text-warning',
  COMPLETED: 'bg-success/15 text-success',
  CANCELLED: 'bg-destructive/10 text-destructive',
};

function operationalDate(timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toLocaleUpperCase();
}

function formatTime(value: string, locale: string, timeZone: string) {
  return new Intl.DateTimeFormat(locale, { timeStyle: 'short', timeZone }).format(new Date(value));
}

function TreatmentStatusBadge({ status }: { status: VisitItemStatus }) {
  const t = useTranslations('providerWork');
  return (
    <span
      className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[status]}`}
    >
      {t(`statuses.${status}`)}
    </span>
  );
}

function TreatmentWorkRow({
  item,
  queryKey,
  timeZone,
}: {
  item: ProviderWorkItem;
  queryKey: readonly unknown[];
  timeZone: string;
}) {
  const t = useTranslations('providerWork');
  const locale = useLocale();
  const client = useQueryClient();
  const action =
    item.status === 'PENDING' ? 'start' : item.status === 'IN_PROGRESS' ? 'complete' : null;
  const mutation = useMutation({
    mutationFn: () => transitionVisitItem(item.visitId, item.id, action!),
    onSuccess: async () => {
      toast.success(t(action === 'start' ? 'startedSuccess' : 'completedSuccess'));
      await client.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      const requestId = error instanceof ApiError ? error.requestId : undefined;
      toast.error(requestId ? t('updateFailedWithId', { requestId }) : t('updateFailed'));
    },
  });
  const isFinished = item.status === 'COMPLETED' || item.status === 'CANCELLED';

  return (
    <li
      className={`grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-x-5 ${isFinished ? 'opacity-75' : ''}`}
    >
      <div className="min-w-0">
        <p className="font-semibold text-foreground" dir="auto">
          {item.serviceNameSnapshot}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {item.catalogService.durationMinutes && (
            <span>
              {t('duration')}: {t('minutesShort', { count: item.catalogService.durationMinutes })}
            </span>
          )}
          {item.startedAt && (
            <span>
              {t('startedAt')}: {formatTime(item.startedAt, locale, timeZone)}
            </span>
          )}
          {item.completedAt && (
            <span>
              {t('completedAt')}: {formatTime(item.completedAt, locale, timeZone)}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col items-stretch gap-2 sm:items-end">
        <TreatmentStatusBadge status={item.status} />
        {action && (
          <Button
            className="w-full sm:w-auto"
            size="sm"
            variant={action === 'complete' ? 'secondary' : 'default'}
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            aria-label={`${t(action === 'start' ? 'startTreatment' : 'completeTreatment')}: ${item.serviceNameSnapshot}`}
          >
            {mutation.isPending ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            ) : action === 'start' ? (
              <CirclePlay className="size-4" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="size-4" aria-hidden="true" />
            )}
            {t(action === 'start' ? 'startTreatment' : 'completeTreatment')}
          </Button>
        )}
      </div>
    </li>
  );
}

type WorkGroup = {
  visitId: string;
  visit: ProviderWorkItem['visit'];
  items: ProviderWorkItem[];
};

function VisitWorkGroup({
  group,
  queryKey,
  timeZone,
}: {
  group: WorkGroup;
  queryKey: readonly unknown[];
  timeZone: string;
}) {
  const t = useTranslations('providerWork');
  const locale = useLocale();
  const totalDuration = group.items.reduce(
    (total, item) => total + (item.catalogService.durationMinutes ?? 0),
    0,
  );

  return (
    <article className="grid gap-4 rounded-[14px] border border-border/70 bg-card/80 p-5 shadow-sm lg:grid-cols-[8rem_15rem_minmax(0,1fr)] lg:gap-6 lg:p-6">
      <div className="relative flex items-center gap-3 lg:block lg:border-e lg:border-border/70 lg:pe-6">
        <span
          className="absolute -end-[0.45rem] top-1.5 hidden size-3 rounded-full border-[3px] border-card bg-secondary shadow-sm lg:block"
          aria-hidden="true"
        />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('visitTime')}
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-primary">
            {group.visit.startedAt
              ? formatTime(group.visit.startedAt, locale, timeZone)
              : t('timeNotRecorded')}
          </p>
        </div>
        {totalDuration > 0 && (
          <p className="ms-auto inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground lg:ms-0 lg:mt-3">
            <Clock3 className="size-3.5" aria-hidden="true" />
            {t('minutesShort', { count: totalDuration })}
          </p>
        )}
      </div>
      <header className="flex min-w-0 items-center gap-3 border-b border-border/70 pb-4 lg:self-start lg:border-0 lg:pb-0">
        <span
          className="grid size-11 shrink-0 place-items-center rounded-full bg-accent/20 font-display text-sm font-semibold text-primary lg:size-12"
          aria-hidden="true"
        >
          {initials(group.visit.customer.name)}
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold" dir="auto">
            {group.visit.customer.name}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('treatmentCount', { count: group.items.length })}
          </p>
        </div>
      </header>
      <div className="min-w-0 lg:rounded-xl lg:border lg:border-border/60 lg:bg-background/25 lg:px-4 lg:py-3">
        <ul className="divide-y divide-border/70">
          {group.items.map((item) => (
            <TreatmentWorkRow key={item.id} item={item} queryKey={queryKey} timeZone={timeZone} />
          ))}
        </ul>
      </div>
    </article>
  );
}

function ProviderWorkSkeleton() {
  return (
    <div className="space-y-5" role="status" aria-label="Loading">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-[14px] bg-muted" />
        ))}
      </div>
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="h-48 animate-pulse rounded-[14px] bg-muted" />
      ))}
    </div>
  );
}

export function ProviderWorkToday() {
  const t = useTranslations('providerWork');
  const locale = useLocale();
  const { session, activeBranch } = useSession();
  const tenantId = session?.tenant?.id ?? '';
  const timeZone = activeBranch?.timezone ?? session?.tenant?.timezone ?? 'UTC';
  const date = operationalDate(timeZone);
  const queryKey = queryKeys.providerWorkToday(tenantId, activeBranch?.id ?? '', date);
  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) => getMyWork(activeBranch!.id, date, signal),
    enabled: Boolean(tenantId && activeBranch),
  });
  const items = query.data ?? [];
  const groups = Array.from(
    items
      .reduce((map, item) => {
        const group = map.get(item.visitId);
        if (group) group.items.push(item);
        else map.set(item.visitId, { visitId: item.visitId, visit: item.visit, items: [item] });
        return map;
      }, new Map<string, WorkGroup>())
      .values(),
  );
  groups.forEach((group) =>
    group.items.sort(
      (a, b) =>
        statusOrder[a.status] - statusOrder[b.status] || a.createdAt.localeCompare(b.createdAt),
    ),
  );
  groups.sort(
    (a, b) =>
      Math.min(...a.items.map((item) => statusOrder[item.status])) -
        Math.min(...b.items.map((item) => statusOrder[item.status])) ||
      a.items[0].createdAt.localeCompare(b.items[0].createdAt),
  );
  const error = query.error instanceof ApiError ? query.error : null;
  const assigned = items.filter((item) => item.status !== 'CANCELLED').length;
  const metrics = [
    {
      label: 'assignedToday' as const,
      value: assigned,
      icon: CalendarDays,
      tint: 'bg-accent/20 text-secondary',
    },
    {
      label: 'inProgress' as const,
      value: items.filter((item) => item.status === 'IN_PROGRESS').length,
      icon: CirclePlay,
      tint: 'bg-warning/15 text-warning',
    },
    {
      label: 'completedToday' as const,
      value: items.filter((item) => item.status === 'COMPLETED').length,
      icon: CircleCheckBig,
      tint: 'bg-success/15 text-success',
    },
    {
      label: 'remaining' as const,
      value: items.filter((item) => item.status !== 'COMPLETED' && item.status !== 'CANCELLED')
        .length,
      icon: Hourglass,
      tint: 'bg-primary/10 text-primary',
    },
  ];

  return (
    <section aria-labelledby="provider-work-heading" className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="provider-work-heading" className="text-2xl font-semibold tracking-tight">
          {t('title')}
        </h2>
        {activeBranch && (
          <p className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <MapPin className="size-3.5 text-secondary" aria-hidden="true" />
            {t('branchAndDate', {
              branch: activeBranch.name,
              date: new Intl.DateTimeFormat(locale, {
                month: 'short',
                day: 'numeric',
                timeZone,
              }).format(new Date()),
            })}
          </p>
        )}
      </div>

      {activeBranch && query.isLoading ? (
        <ProviderWorkSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {metrics.map(({ label, value, icon: Icon, tint }) => (
              <Card key={label} className="border-border/70 shadow-sm">
                <CardContent className="flex items-center gap-3 p-4 sm:p-5">
                  <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${tint}`}>
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-muted-foreground sm:text-sm">
                      {t(label)}
                    </p>
                    <p className="mt-0.5 text-2xl font-semibold leading-none">{value}</p>
                    <p className="mt-1 hidden text-xs text-muted-foreground sm:block">
                      {t(value === 1 ? 'treatment' : 'treatments')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {!activeBranch && (
            <div className="rounded-[14px] bg-muted/70 p-6 text-sm text-muted-foreground">
              {t('selectBranch')}
            </div>
          )}
          {activeBranch && query.isError && (
            <div
              className="rounded-[14px] border border-destructive/20 bg-destructive/5 p-6"
              role="alert"
            >
              <p>
                {error?.requestId
                  ? t('loadFailedWithId', { requestId: error.requestId })
                  : t('loadFailed')}
              </p>
              <Button className="mt-4" variant="outline" onClick={() => query.refetch()}>
                <RotateCcw className="size-4" aria-hidden="true" />
                {t('retry')}
              </Button>
            </div>
          )}
          {activeBranch && query.isSuccess && !items.length && (
            <div className="py-12 text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-accent/15 text-secondary">
                <Sparkles className="size-6" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-semibold">{t('emptyTitle')}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t('empty')}</p>
            </div>
          )}
          {activeBranch && query.isSuccess && groups.length > 0 && (
            <div className="space-y-4">
              {groups.map((group) => (
                <VisitWorkGroup
                  key={group.visitId}
                  group={group}
                  queryKey={queryKey}
                  timeZone={timeZone}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
