import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './error';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (count, error) =>
          error instanceof ApiError && [401, 403, 404].includes(error.status) ? false : count < 2,
      },
      mutations: { retry: false },
    },
  });
}

export const queryKeys = {
  session: ['session'] as const,
  branch: (tenantId: string, branchId: string, resource: string) =>
    ['tenant', tenantId, 'branch', branchId, resource] as const,
};
