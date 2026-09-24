'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { Brand } from '@/components/layout/brand';
import { LoginForm } from './login-form';

export function LoginContent() {
  const t = useTranslations('auth');
  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden bg-sidebar p-12 text-sidebar-foreground lg:flex lg:flex-col">
        <Brand dark />
        <div className="my-auto max-w-xl">
          <p className="font-display text-5xl font-semibold leading-tight">{t('brandHeadline')}</p>
          <p className="mt-6 max-w-md text-lg leading-8 text-sidebar-foreground/75">
            {t('brandSupporting')}
          </p>
        </div>
        <div
          className="pointer-events-none absolute -bottom-12 -end-20 h-[460px] w-[680px] bg-accent opacity-30 [mask-image:url('/botanical-lines.svg')] [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain]"
          aria-hidden="true"
        />
      </section>
      <section className="flex items-center justify-center p-5 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <Brand />
          </div>
          <div className="mb-8">
            <h1 className="font-display text-4xl font-semibold">{t('welcome')}</h1>
            <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>
          </div>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
