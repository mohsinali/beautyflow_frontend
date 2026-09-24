'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTenantLanguage } from '../api/update-tenant-language';
import { queryKeys } from '@/lib/api/query-client';
import type { Session, TenantLanguage } from '@/types/session';

export function useUpdateTenantLanguage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (language: TenantLanguage) => updateTenantLanguage(language),
    onSuccess: (settings) => {
      queryClient.setQueryData<Session>(queryKeys.session, (session) => {
        if (!session?.tenant || session.tenant.id !== settings.id) return session;
        return {
          ...session,
          tenant: {
            ...session.tenant,
            name: settings.name,
            language: settings.defaultLanguage,
            currencyCode: settings.currencyCode,
            timezone: settings.timezone,
            settingsResolved: true,
          },
        };
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.session });
    },
  });
}
