'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, CirclePlay, LoaderCircle, RotateCcw } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiError } from '@/lib/api/error';
import { queryKeys } from '@/lib/api/query-client';
import { useSession } from '@/providers/session-provider';
import { getMyWork, transitionVisitItem } from '@/features/visits/api/visits-api';
import type { ProviderWorkItem, VisitItemStatus } from '@/features/visits/types/visit';

const statusOrder: Record<VisitItemStatus, number> = {
  IN_PROGRESS: 0,
  PENDING: 1,
  COMPLETED: 2,
  CANCELLED: 3,
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

function TreatmentRow({
  item,
  queryKey,
}: {
  item: ProviderWorkItem;
  queryKey: readonly unknown[];
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
  const timestamp =
    item.status === 'IN_PROGRESS'
      ? item.startedAt
      : item.status === 'COMPLETED'
        ? item.completedAt
        : null;
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-border bg-background/60 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-semibold" dir="auto">
          {item.serviceNameSnapshot}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="rounded-full bg-muted px-2.5 py-1 font-medium text-foreground">
            {t(`statuses.${item.status}`)}
          </span>
          {timestamp && (
            <span>
              {t(item.status === 'IN_PROGRESS' ? 'startedAt' : 'completedAt')}:{' '}
              {new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(new Date(timestamp))}
            </span>
          )}
        </div>
      </div>
      {action && (
        <Button
          className="w-full shrink-0 sm:w-auto"
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
    </li>
  );
}

export function ProviderWorkToday() {
  const t = useTranslations('providerWork');
  const { session, activeBranch } = useSession();
  const tenantId = session?.tenant?.id ?? '';
  const date = operationalDate(activeBranch?.timezone ?? session?.tenant?.timezone ?? 'UTC');
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
        else
          map.set(item.visitId, {
            visitId: item.visitId,
            customer: item.visit.customer,
            items: [item],
          });
        return map;
      }, new Map<string, { visitId: string; customer: ProviderWorkItem['visit']['customer']; items: ProviderWorkItem[] }>())
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
  return (
    <section aria-labelledby="provider-work-heading" className="space-y-5">
      <div>
        <h1
          id="provider-work-heading"
          className="text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          {t('title')}
        </h1>
        <p className="mt-1 text-muted-foreground">{t('description')}</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          ['assignedToday', items.length],
          ['inProgress', items.filter((item) => item.status === 'IN_PROGRESS').length],
          ['completedToday', items.filter((item) => item.status === 'COMPLETED').length],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardContent className="pt-5 sm:pt-6">
              <p className="text-sm text-muted-foreground">{t(label as 'assignedToday')}</p>
              <p className="mt-1 text-3xl font-semibold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {!activeBranch && <Card className="p-6 text-muted-foreground">{t('selectBranch')}</Card>}
      {activeBranch && query.isLoading && (
        <Card className="p-6" role="status">
          <LoaderCircle className="me-2 inline size-4 animate-spin" />
          {t('loading')}
        </Card>
      )}
      {activeBranch && query.isError && (
        <Card className="p-6" role="alert">
          <p>
            {error?.requestId
              ? t('loadFailedWithId', { requestId: error.requestId })
              : t('loadFailed')}
          </p>
          <Button className="mt-4" variant="outline" onClick={() => query.refetch()}>
            <RotateCcw className="size-4" />
            {t('retry')}
          </Button>
        </Card>
      )}
      {activeBranch && query.isSuccess && !items.length && (
        <Card className="p-6 text-muted-foreground">{t('empty')}</Card>
      )}
      {activeBranch &&
        query.isSuccess &&
        items.length > 0 &&
        items.every((item) => ['COMPLETED', 'CANCELLED'].includes(item.status)) && (
          <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground" role="status">
            {t('noActive')}
          </p>
        )}
      <div className="grid gap-4 lg:grid-cols-2">
        {groups.map((group) => (
          <Card key={group.visitId}>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-baseline justify-between gap-2">
                <span dir="auto">{group.customer.name}</span>
                <span className="text-sm font-medium text-muted-foreground">
                  {t('treatmentCount', { count: group.items.length })}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {group.items.map((item) => (
                  <TreatmentRow key={item.id} item={item} queryKey={queryKey} />
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
