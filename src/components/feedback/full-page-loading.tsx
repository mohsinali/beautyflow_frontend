'use client';

import { Flower2, LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function FullPageLoading() {
  const t = useTranslations('common');
  return (
    <main
      className="grid min-h-screen place-items-center bg-background p-6"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex max-w-sm flex-col items-center text-center">
        <span className="mb-5 grid size-16 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
          <Flower2 className="size-8" aria-hidden="true" />
        </span>
        <LoaderCircle className="mb-4 size-5 animate-spin text-secondary" aria-hidden="true" />
        <h1 className="font-display text-2xl font-semibold text-foreground">{t('loading')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('loadingDescription')}</p>
      </div>
    </main>
  );
}
