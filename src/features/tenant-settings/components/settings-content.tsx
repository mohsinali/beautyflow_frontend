'use client';

import { ShieldX } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LanguageSettingsCard } from './language-settings-card';
import { Card, CardContent } from '@/components/ui/card';
import { permissions } from '@/lib/permissions/permissions';
import { usePermissions } from '@/providers/session-provider';

export function SettingsContent() {
  const t = useTranslations();
  const { can } = usePermissions();

  if (!can(permissions.tenantSettingsView)) {
    return (
      <Card role="alert">
        <CardContent className="flex items-start gap-4 pt-5 sm:pt-6">
          <ShieldX className="size-6 shrink-0 text-destructive" aria-hidden="true" />
          <div>
            <h1 className="text-lg font-semibold">{t('unauthorized.title')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('unauthorized.description')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-secondary">{t('settings.general')}</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
          {t('settings.title')}
        </h1>
        <p className="mt-2 text-muted-foreground">{t('settings.regional')}</p>
      </header>
      <LanguageSettingsCard />
    </div>
  );
}
