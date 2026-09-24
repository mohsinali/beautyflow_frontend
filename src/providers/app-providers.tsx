'use client';

import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import type { ReactNode } from 'react';
import { QueryProvider } from './query-provider';
import { SessionProvider } from './session-provider';
import { TenantI18nProvider } from './i18n-provider';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryProvider>
        <SessionProvider>
          <TenantI18nProvider>
            {children}
            <Toaster richColors position="top-center" />
          </TenantI18nProvider>
        </SessionProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
