'use client';

import {
  Building2,
  CircleUserRound,
  Clock3,
  Coins,
  Languages,
  MapPin,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { GreetingBanner } from './greeting-banner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSession } from '@/providers/session-provider';

export function DashboardContent() {
  const t = useTranslations();
  const locale = useLocale();
  const { session, activeBranch } = useSession();
  if (!session) return null;
  const role = session.platformRole ?? session.tenant?.role;
  const context = session.platformRole
    ? [
        {
          icon: CircleUserRound,
          label: t('dashboard.role'),
          value: role ? t(`roles.${role}`) : t('common.unknown'),
        },
        { icon: ShieldCheck, label: t('dashboard.context'), value: t('dashboard.platformTitle') },
      ]
    : [
        {
          icon: Building2,
          label: t('dashboard.salon'),
          value: session.tenant?.name ?? t('common.unknown'),
        },
        {
          icon: CircleUserRound,
          label: t('dashboard.role'),
          value: role ? t(`roles.${role}`) : t('common.unknown'),
        },
        {
          icon: MapPin,
          label: t('dashboard.activeBranch'),
          value: activeBranch?.name ?? t('common.selectBranch'),
        },
        {
          icon: Languages,
          label: t('dashboard.language'),
          value: session.tenant?.language === 'AR' ? 'العربية' : 'English',
        },
        {
          icon: Coins,
          label: t('dashboard.currency'),
          value: session.tenant?.currencyCode ?? t('common.unknown'),
        },
        {
          icon: Clock3,
          label: t('dashboard.timezone'),
          value: activeBranch?.timezone ?? session.tenant?.timezone ?? t('common.unknown'),
        },
      ];
  const modules = session.platformRole
    ? ['tenants', 'platformUsers']
    : ['catalog', 'providers', 'customers', 'visits', 'reports'];
  return (
    <div className="space-y-6" data-locale={locale}>
      <GreetingBanner />
      {!session.platformRole && session.accessibleBranches.length > 1 && !activeBranch && (
        <div
          className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-foreground"
          role="status"
        >
          {t('dashboard.noBranch')}
        </div>
      )}
      {!session.platformRole && !session.tenant?.settingsResolved && (
        <div
          className="rounded-xl border border-information/30 bg-information/10 p-4 text-sm text-foreground"
          role="status"
        >
          {t('dashboard.contractNotice')}
        </div>
      )}
      <section aria-labelledby="context-heading">
        <h2 id="context-heading" className="mb-3 text-lg font-semibold">
          {t('dashboard.context')}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {context.map(({ icon: Icon, label, value }) => (
            <Card key={label}>
              <CardContent className="flex items-center gap-4 pt-5 sm:pt-6">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-muted text-secondary">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">{label}</p>
                  <p className="mt-1 truncate font-semibold" dir="auto">
                    {value}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-secondary" />
              {session.platformRole ? t('dashboard.platformTitle') : t('dashboard.gettingStarted')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="leading-7 text-muted-foreground">
              {session.platformRole
                ? t('dashboard.platformBody')
                : t('dashboard.gettingStartedBody')}
            </p>
            {!session.platformRole && (
              <p className="mt-4 rounded-xl bg-muted p-4 text-sm text-muted-foreground">
                {t('dashboard.tenantDataNotice')}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.upcoming')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {modules.map((module) => (
              <div
                key={module}
                className="flex min-h-11 items-center justify-between rounded-xl border border-border px-4"
              >
                <span className="text-sm font-medium">{t(`nav.${module}`)}</span>
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                  {t('common.comingSoon')}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
