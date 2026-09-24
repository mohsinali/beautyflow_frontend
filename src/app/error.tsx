'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/feedback/error-state';
import { logger } from '@/lib/logging/logger';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Application error', { digest: error.digest });
  }, [error]);
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="w-full max-w-md">
        <ErrorState error={error} onRetry={reset} />
      </div>
    </main>
  );
}
