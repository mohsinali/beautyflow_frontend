'use client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  CircleCheckBig,
  CirclePlay,
  Pencil,
  Play,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { queryKeys } from '@/lib/api/query-client';
import { useCurrentTenant } from '@/providers/session-provider';
import { getVisit, transitionVisit, transitionVisitItem } from '../api/visits-api';
import { formatDiscount, formatMoney } from '../lib/money';

export function VisitDetailScreen({ visitId }: { visitId: string }) {
  const t = useTranslations('visits');
  const tenant = useCurrentTenant();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.visitDetail(tenant?.id ?? '', visitId),
    queryFn: ({ signal }) => getVisit(visitId, signal),
    enabled: Boolean(tenant),
  });
  const refresh = () =>
    client.invalidateQueries({ queryKey: queryKeys.visitDetail(tenant?.id ?? '', visitId) });
  const visitAction = useMutation({
    mutationFn: (action: 'start' | 'complete' | 'cancel') => transitionVisit(visitId, action),
    onSuccess: refresh,
    onError: () => toast.error(t('actionFailed')),
  });
  const itemAction = useMutation({
    mutationFn: ({ itemId, action }: { itemId: string; action: 'start' | 'complete' | 'cancel' }) =>
      transitionVisitItem(visitId, itemId, action),
    onSuccess: refresh,
    onError: () => toast.error(t('actionFailed')),
  });
  const visit = query.data;
  if (!visit) return <Card className="p-6">{t('loading')}</Card>;
  const canComplete =
    visit.status === 'IN_PROGRESS' &&
    visit.items.some((i) => i.status !== 'CANCELLED') &&
    visit.items.filter((i) => i.status !== 'CANCELLED').every((i) => i.status === 'COMPLETED');
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <Button asChild variant="ghost">
            <Link href="/dashboard/visits">
              <ArrowLeft className="size-4 rtl:rotate-180" />
              {t('backToVisits')}
            </Link>
          </Button>
          <h1 className="mt-2 text-3xl font-semibold">{visit.customer.name}</h1>
          <p className="text-muted-foreground">
            {visit.branch.name} · {t(`statuses.${visit.status}`)}
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-2">
          {['DRAFT', 'IN_PROGRESS'].includes(visit.status) && (
            <Button asChild variant="outline">
              <Link href={`/dashboard/pos?visitId=${visit.id}`}>
                <Pencil className="size-4" />
                {t('editVisit')}
              </Link>
            </Button>
          )}
          {visit.status === 'DRAFT' && (
            <Button onClick={() => visitAction.mutate('start')} disabled={visitAction.isPending}>
              <Play className="size-4" />
              {t('startVisit')}
            </Button>
          )}
          {canComplete && (
            <Button onClick={() => visitAction.mutate('complete')} disabled={visitAction.isPending}>
              <CheckCircle2 className="size-4" />
              {t('completeVisit')}
            </Button>
          )}
          {['DRAFT', 'IN_PROGRESS'].includes(visit.status) && (
            <Button
              variant="destructive"
              onClick={() => window.confirm(t('cancelConfirm')) && visitAction.mutate('cancel')}
              disabled={visitAction.isPending}
            >
              <Ban className="size-4" />
              {t('cancelVisit')}
            </Button>
          )}
        </div>
      </div>
      <Card className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <Info label={t('customer')} value={visit.customer.name} />
        <Info label={t('branch')} value={visit.branch.name} />
        <Info
          label={t('defaultProvider')}
          value={visit.defaultProvider?.displayName ?? t('unassigned')}
        />
        <Info label={t('createdTime')} value={new Date(visit.createdAt).toLocaleString()} />
        {visit.startedAt && (
          <Info label={t('startedTime')} value={new Date(visit.startedAt).toLocaleString()} />
        )}{' '}
        {visit.completedAt && (
          <Info label={t('completedTime')} value={new Date(visit.completedAt).toLocaleString()} />
        )}
      </Card>
      <div className="grid gap-3">
        {visit.items.map((item) => (
          <Card className="space-y-3 p-4" key={item.id}>
            <div className="flex justify-between gap-3">
              <div>
                <h2 className="font-semibold">{item.serviceNameSnapshot}</h2>
                <p className="text-sm text-muted-foreground">
                  {item.provider?.displayName ?? t('unassigned')}
                </p>
              </div>
              <span className="rounded-full bg-muted px-3 py-1 text-xs">
                {t(`statuses.${item.status}`)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <Info label={t('originalPrice')} value={formatMoney(item.originalPrice)} />
              <Info label={t('price')} value={formatMoney(item.chargedPrice)} />
              <Info label={t('discount')} value={formatDiscount(item.discountAmount)} />
              <Info label={t('finalAmount')} value={formatMoney(item.finalAmount)} />
            </div>
            {visit.status === 'IN_PROGRESS' && ['PENDING', 'IN_PROGRESS'].includes(item.status) && (
              <div className="flex flex-wrap gap-2">
                {item.status === 'PENDING' && (
                  <Button
                    size="sm"
                    onClick={() => itemAction.mutate({ itemId: item.id, action: 'start' })}
                  >
                    <CirclePlay className="size-4" />
                    {t('startTreatment')}
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => itemAction.mutate({ itemId: item.id, action: 'complete' })}
                >
                  <CircleCheckBig className="size-4" />
                  {t('completeTreatment')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => itemAction.mutate({ itemId: item.id, action: 'cancel' })}
                >
                  <XCircle className="size-4" />
                  {t('cancelTreatment')}
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
      <Card className="ms-auto max-w-md space-y-2 p-5">
        <div className="flex justify-between">
          <span>{t('subtotal')}</span>
          <span>
            {formatMoney(visit.subtotal)} {tenant?.currencyCode}
          </span>
        </div>
        <div className="flex justify-between">
          <span>{t('totalDiscount')}</span>
          <span>{formatDiscount(visit.discountAmount)}</span>
        </div>
        <div className="flex justify-between border-t pt-3 text-xl font-semibold">
          <span>{t('total')}</span>
          <span>
            {formatMoney(visit.total)} {tenant?.currencyCode}
          </span>
        </div>
      </Card>
    </div>
  );
}
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-xs text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
