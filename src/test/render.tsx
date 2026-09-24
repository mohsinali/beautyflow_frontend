import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NextIntlClientProvider } from 'next-intl';
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';
import en from '@/messages/en.json';

export function renderApp(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale="en" messages={en} timeZone="UTC">
        {ui}
      </NextIntlClientProvider>
    </QueryClientProvider>,
    options,
  );
}
