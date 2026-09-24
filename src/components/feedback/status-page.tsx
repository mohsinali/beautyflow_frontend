'use client';

import Link from 'next/link';
import { ArrowLeft, ShieldX, SearchX } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Brand } from '@/components/layout/brand';
import { Button } from '@/components/ui/button';

export function StatusPage({ kind }: { kind: 'unauthorized' | 'notFound' }) {
  const t = useTranslations(kind);
  const Icon = kind === 'unauthorized' ? ShieldX : SearchX;
  return (
    <main className="grid min-h-screen place-items-center bg-background p-6 text-center">
      <div className="max-w-md">
        <div className="mb-10 flex justify-center">
          <Brand />
        </div>
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-muted text-secondary">
          <Icon className="size-8" />
        </span>
        <h1 className="mt-6 font-display text-3xl font-semibold">{t('title')}</h1>
        <p className="mt-3 leading-7 text-muted-foreground">{t('description')}</p>
        <Button asChild className="mt-7">
          <Link href="/dashboard">
            <ArrowLeft className="size-4 rtl:rotate-180" />
            {t('back')}
          </Link>
        </Button>
      </div>
    </main>
  );
}
