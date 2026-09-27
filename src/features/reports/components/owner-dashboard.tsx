'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { GreetingBanner } from '@/components/dashboard/greeting-banner';
import { useSession } from '@/providers/session-provider';
import { useDashboardReport } from '../hooks/use-reports';
import { BranchScope, MetricCard, Money, RankedList, ReportState } from './report-ui';

export function OwnerDashboard() {
  const t = useTranslations('reports');
  const { session, activeBranch } = useSession();
  const [branch, setBranch] = useState(activeBranch?.id ?? 'all');
  const scope = branch === 'all' ? { scope: 'all' as const } : { branchId: branch };
  const report = useDashboardReport(session?.tenant?.id ?? '', scope, Boolean(session));
  const data = report.data;
  const currency = session?.tenant?.currencyCode ?? 'USD';
  return (
    <div className="space-y-6">
      <GreetingBanner />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{t('today')}</h2>
          <p className="text-sm text-muted-foreground">{t('dashboardDescription')}</p>
        </div>
        <div className="w-full sm:w-64">
          <BranchScope
            branches={session?.accessibleBranches ?? []}
            value={branch}
            onChange={setBranch}
          />
        </div>
      </div>
      <ReportState loading={report.isLoading} error={report.isError}>
        {data && (
          <>
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label={t('summary')}>
              <MetricCard label={t('visitsToday')}>{data.summary.visitsToday}</MetricCard>
              <MetricCard label={t('completedTreatmentsToday')}>
                {data.summary.completedTreatmentsToday}
              </MetricCard>
              <MetricCard label={t('revenueRecordedToday')}>
                <Money value={data.summary.revenueRecordedToday} currency={currency} />
              </MetricCard>
              <MetricCard label={t('activeVisits')}>{data.summary.activeVisits}</MetricCard>
              <MetricCard label={t('paidVisitsToday')}>{data.summary.paidVisitsToday}</MetricCard>
              <MetricCard label={t('unpaidCompletedVisits')}>
                {data.summary.unpaidCompletedVisits}
              </MetricCard>
            </section>
            <div className="grid gap-6 lg:grid-cols-2">
              <RankedList title={t('topTreatments')}>
                {data.topTreatments.length ? (
                  data.topTreatments.map((item, index) => (
                    <div
                      key={`${item.name}-${index}`}
                      className="flex justify-between gap-4 rounded-lg bg-muted/50 p-3"
                    >
                      <span dir="auto">{item.name}</span>
                      <strong>{item.treatmentsCompleted}</strong>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">{t('empty')}</p>
                )}
              </RankedList>
              <RankedList title={t('topProviders')}>
                {data.topProviders.length ? (
                  data.topProviders.map((item) => (
                    <div
                      key={item.providerId}
                      className="flex items-start justify-between gap-4 rounded-lg bg-muted/50 p-3"
                    >
                      <div>
                        <p className="font-medium" dir="auto">
                          {item.providerName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t('treatmentsCount', { count: item.treatmentsCompleted })}
                        </p>
                      </div>
                      <p className="text-sm font-medium">
                        <Money value={item.revenueHandled} currency={currency} />{' '}
                        <span className="text-muted-foreground">{t('revenueHandled')}</span>
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">{t('empty')}</p>
                )}
              </RankedList>
            </div>
          </>
        )}
      </ReportState>
    </div>
  );
}
