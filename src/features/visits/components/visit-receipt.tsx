'use client';

import Link from 'next/link';
import { ArrowLeft, LoaderCircle, Printer } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorState } from '@/components/feedback/error-state';
import { ApiError } from '@/lib/api/error';
import { queryKeys } from '@/lib/api/query-client';
import { permissions } from '@/lib/permissions/permissions';
import { useCurrentTenant, usePermissions } from '@/providers/session-provider';
import { getVisit } from '../api/visits-api';
import { formatDiscount, formatMoney } from '../lib/money';

export function VisitReceiptScreen({ visitId }: { visitId: string }) {
  const t = useTranslations('visits');
  const locale = useLocale();
  const tenant = useCurrentTenant();
  const { can } = usePermissions();
  const canView = can(permissions.visitRead);
  const query = useQuery({
    queryKey: queryKeys.visitDetail(tenant?.id ?? '', visitId),
    queryFn: ({ signal }) => getVisit(visitId, signal),
    enabled: Boolean(tenant && canView),
  });

  if (!canView)
    return (
      <ErrorState
        error={new Error(t('receiptPermissionDenied'))}
        title={t('receiptPermissionDenied')}
        description={t('receiptPermissionDeniedDescription')}
      />
    );
  if (query.isLoading)
    return (
      <Card className="py-14 text-center" role="status">
        <LoaderCircle className="mx-auto size-7 animate-spin text-secondary" />
        <p className="mt-3 text-muted-foreground">{t('loadingReceipt')}</p>
      </Card>
    );
  if (query.isError) {
    const missing = query.error instanceof ApiError && query.error.status === 404;
    const forbidden = query.error instanceof ApiError && query.error.status === 403;
    return (
      <ErrorState
        error={query.error}
        title={t(
          missing ? 'receiptNotFound' : forbidden ? 'receiptPermissionDenied' : 'receiptLoadFailed',
        )}
        description={t(
          missing
            ? 'receiptNotFoundDescription'
            : forbidden
              ? 'receiptPermissionDeniedDescription'
              : 'receiptLoadFailedDescription',
        )}
        onRetry={missing || forbidden ? undefined : () => void query.refetch()}
      />
    );
  }

  const visit = query.data!;
  if (visit.status !== 'COMPLETED')
    return (
      <ErrorState
        error={new Error(t('receiptCompletedOnly'))}
        title={t('receiptUnavailable')}
        description={t('receiptCompletedOnly')}
      />
    );

  const timeZone = visit.branch.timezone ?? tenant?.timezone ?? 'UTC';
  const currency = tenant?.currencyCode ?? '';
  const items = visit.items.filter((item) => item.status !== 'CANCELLED');
  const dateTime = (value: string) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone,
    }).format(new Date(value));
  const money = (value: string) => `${formatMoney(value)} ${currency}`.trim();
  const discountMoney = (value: string) => `${formatDiscount(value)} ${currency}`.trim();

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="receipt-no-print flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost">
          <Link href={`/dashboard/visits/${visit.id}`}>
            <ArrowLeft className="size-4 rtl:rotate-180" />
            {t('backToVisit')}
          </Link>
        </Button>
        <Button onClick={() => window.print()} aria-label={t('printReceipt')}>
          <Printer className="size-4" />
          {t('printReceipt')}
        </Button>
      </div>

      <article
        className="receipt-print-root rounded-2xl border bg-card p-5 shadow-card sm:p-8"
        dir={locale === 'ar' ? 'rtl' : 'ltr'}
      >
        <header className="flex flex-col gap-5 border-b pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-secondary">{t('receipt')}</p>
            <h1 className="font-display text-3xl font-semibold" dir="auto">
              {tenant?.name}
            </h1>
            <p className="mt-1 font-medium" dir="auto">
              {visit.branch.name}
            </p>
            {(visit.branch.address || visit.branch.city) && (
              <p className="mt-1 text-sm text-muted-foreground" dir="auto">
                {[visit.branch.address, visit.branch.city].filter(Boolean).join(', ')}
              </p>
            )}
            {visit.branch.phone && (
              <p className="text-sm text-muted-foreground" dir="auto">
                {visit.branch.phone}
              </p>
            )}
          </div>
          <dl className="grid gap-2 text-sm sm:text-end">
            <ReceiptField
              label={t('receiptReference')}
              value={`#${visit.id.slice(0, 8).toUpperCase()}`}
            />
            <ReceiptField
              label={t('visitDate')}
              value={dateTime(visit.completedAt ?? visit.createdAt)}
            />
            <ReceiptField label={t('status')} value={t(`statuses.${visit.status}`)} />
            <ReceiptField
              label={t('paymentStatus')}
              value={t(`paymentStatuses.${visit.paymentStatus}`)}
            />
          </dl>
        </header>

        <section className="border-b py-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t('customer')}
          </h2>
          <p className="mt-2 text-lg font-medium" dir="auto">
            {visit.customer.name}
          </p>
          {visit.customer.phone && (
            <p className="text-sm text-muted-foreground" dir="auto">
              {visit.customer.phone}
            </p>
          )}
        </section>

        <section className="py-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t('treatments')}
          </h2>
          <div className="space-y-3 md:hidden">
            {items.map((item) => (
              <ReceiptItemCard
                key={item.id}
                item={item}
                money={money}
                discountMoney={discountMoney}
                t={t}
              />
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-start text-muted-foreground">
                  <th className="py-2 pe-3 text-start font-medium">{t('treatment')}</th>
                  <th className="px-3 py-2 text-start font-medium">{t('provider')}</th>
                  <th className="px-3 py-2 text-end font-medium">{t('price')}</th>
                  <th className="px-3 py-2 text-end font-medium">{t('discount')}</th>
                  <th className="py-2 ps-3 text-end font-medium">{t('amount')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr className="border-b last:border-0" key={item.id}>
                    <td className="py-3 pe-3 font-medium" dir="auto">
                      {item.serviceNameSnapshot}
                      {item.originalPrice !== item.chargedPrice && (
                        <span className="block text-xs text-muted-foreground">
                          {t('originalPrice')}: {money(item.originalPrice)}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3" dir="auto">
                      {item.provider?.displayName ?? '—'}
                    </td>
                    <td className="px-3 py-3 text-end tabular-nums">{money(item.chargedPrice)}</td>
                    <td className="px-3 py-3 text-end tabular-nums">
                      {discountMoney(item.discountAmount)}
                    </td>
                    <td className="py-3 ps-3 text-end font-medium tabular-nums">
                      {money(item.finalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="ms-auto max-w-sm space-y-2 border-t py-5">
          <TotalRow label={t('subtotal')} value={money(visit.subtotal)} />
          <TotalRow label={t('discount')} value={discountMoney(visit.discountAmount)} />
          <TotalRow label={t('total')} value={money(visit.total)} prominent />
        </section>

        <section className="border-t py-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t('payment')}
          </h2>
          <dl className="grid gap-3 sm:grid-cols-2">
            <ReceiptField
              label={t('paymentStatus')}
              value={t(`paymentStatuses.${visit.paymentStatus}`)}
            />
            {visit.paymentStatus === 'PAID' && visit.paidAt && (
              <ReceiptField label={t('paidAt')} value={dateTime(visit.paidAt)} />
            )}
            {visit.paymentStatus === 'PAID' && visit.paidBy && (
              <ReceiptField
                label={t('recordedBy')}
                value={`${visit.paidBy.firstName} ${visit.paidBy.lastName}`}
              />
            )}
            {visit.paymentStatus === 'PAID' && visit.paymentNote && (
              <ReceiptField label={t('paymentNote')} value={visit.paymentNote} autoDirection />
            )}
          </dl>
        </section>

        <footer className="border-t pt-5 text-center text-sm text-muted-foreground">
          {t('thankYou')}
        </footer>
      </article>
    </div>
  );
}

function ReceiptItemCard({
  item,
  money,
  discountMoney,
  t,
}: {
  item: import('../types/visit').VisitItem;
  money: (value: string) => string;
  discountMoney: (value: string) => string;
  t: (key: string) => string;
}) {
  return (
    <div className="rounded-xl border p-3 text-sm">
      <p className="font-medium" dir="auto">
        {item.serviceNameSnapshot}
      </p>
      {item.provider && (
        <p className="text-muted-foreground" dir="auto">
          {t('provider')}: {item.provider.displayName}
        </p>
      )}
      {item.originalPrice !== item.chargedPrice && (
        <TotalRow label={t('originalPrice')} value={money(item.originalPrice)} />
      )}
      <TotalRow label={t('price')} value={money(item.chargedPrice)} />
      <TotalRow label={t('discount')} value={discountMoney(item.discountAmount)} />
      <TotalRow label={t('amount')} value={money(item.finalAmount)} prominent />
    </div>
  );
}

function ReceiptField({
  label,
  value,
  autoDirection = false,
}: {
  label: string;
  value: string;
  autoDirection?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium" dir={autoDirection ? 'auto' : undefined}>
        {value}
      </dd>
    </div>
  );
}

function TotalRow({
  label,
  value,
  prominent = false,
}: {
  label: string;
  value: string;
  prominent?: boolean;
}) {
  return (
    <div
      className={`flex justify-between gap-6 ${prominent ? 'border-t pt-2 text-lg font-semibold' : ''}`}
    >
      <span>{label}</span>
      <span className="text-end tabular-nums">{value}</span>
    </div>
  );
}
