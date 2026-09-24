'use client';

import { NextIntlClientProvider } from 'next-intl';
import { useEffect, type ReactNode } from 'react';
import { useSession } from './session-provider';
import en from '@/messages/en.json';
import ar from '@/messages/ar.json';

export function TenantI18nProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const locale = session?.tenant?.language === 'AR' ? 'ar' : 'en';
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [locale]);
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={locale === 'ar' ? ar : en}
      timeZone={session?.tenant?.timezone ?? 'UTC'}
      onError={(error) => {
        if (process.env.NODE_ENV === 'development')
          console.warn('[BeautyFlow i18n]', error.message);
      }}
    >
      {children}
    </NextIntlClientProvider>
  );
}
