'use client';

import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { useSession } from '@/providers/session-provider';

export function GreetingBanner() {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const format = useFormatter();
  const { session } = useSession();
  if (!session) return null;
  const timezone = session.tenant?.timezone ?? 'UTC';
  const now = new Date();
  const hour = Number(
    new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      hourCycle: 'h23',
      timeZone: timezone,
    }).format(now),
  );
  const greeting = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  const tenantName = session.tenant?.name ?? 'BeautyFlow';
  return (
    <section
      className="relative isolate min-h-52 overflow-hidden rounded-[14px] border border-accent/25 bg-greeting p-6 sm:p-8 lg:p-10"
      aria-labelledby="greeting-title"
    >
      <div className="relative z-10 max-w-2xl">
        <p className="mb-3 text-sm font-semibold text-secondary">
          {format.dateTime(now, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: timezone,
          })}
        </p>
        <h1
          id="greeting-title"
          className="font-display text-3xl font-semibold leading-tight text-foreground sm:text-4xl"
        >
          {t(greeting, { name: session.user.firstName })}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
          {session.platformRole ? t('platformSupporting') : t('supporting', { tenant: tenantName })}
        </p>
      </div>
      <div
        className="pointer-events-none absolute inset-y-0 end-0 w-[52%] bg-accent opacity-45 [mask-image:url('/botanical-lines.svg')] [mask-position:center] [mask-repeat:no-repeat] [mask-size:cover] rtl:-scale-x-100"
        aria-hidden="true"
      />
    </section>
  );
}
