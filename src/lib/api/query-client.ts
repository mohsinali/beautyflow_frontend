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
  serviceCategories: (tenantId: string) => ['tenant', tenantId, 'service-categories'] as const,
  serviceCategoryList: (
    tenantId: string,
    params: { search: string; isActive: boolean; page: number; pageSize: number },
  ) => [...queryKeys.serviceCategories(tenantId), 'list', params] as const,
  catalogServices: (tenantId: string) => ['tenant', tenantId, 'catalog-services'] as const,
  catalogServiceList: (
    tenantId: string,
    params: {
      search: string;
      categoryId: string;
      isActive: boolean;
      page: number;
      pageSize: number;
    },
  ) => [...queryKeys.catalogServices(tenantId), 'list', params] as const,
  branch: (tenantId: string, branchId: string, resource: string) =>
    ['tenant', tenantId, 'branch', branchId, resource] as const,
};
