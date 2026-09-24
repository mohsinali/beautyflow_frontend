'use client';

import { AlertTriangle, WifiOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api/error';

export function ErrorState({
  error,
  onRetry,
  title,
  description,
}: {
  error: Error;
  onRetry?: () => void;
  title?: string;
  description?: string;
}) {
  const t = useTranslations();
  const apiError = error instanceof ApiError ? error : null;
  const network = apiError?.code === 'NETWORK_ERROR';
  return (
    <div
      className="rounded-[14px] border border-destructive/25 bg-destructive/5 p-6 text-center"
      role="alert"
    >
      {network ? (
        <WifiOff className="mx-auto size-7 text-destructive" />
      ) : (
        <AlertTriangle className="mx-auto size-7 text-destructive" />
      )}
      <h2 className="mt-3 font-semibold">{title ?? t('errors.title')}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {description ?? (network ? t('errors.network') : t('errors.description'))}
      </p>
      {apiError?.requestId && (
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          {t('errors.requestId', { id: apiError.requestId })}
        </p>
      )}
      {onRetry && (
        <Button className="mt-4" variant="outline" onClick={onRetry}>
          {t('common.retry')}
        </Button>
      )}
    </div>
  );
}
