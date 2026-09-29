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
  branches: (tenantId: string) => ['tenant', tenantId, 'branches'] as const,
  branchList: (tenantId: string, page: number) =>
    [...queryKeys.branches(tenantId), 'list', { page }] as const,
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
  catalogServiceDetail: (tenantId: string, serviceId: string) =>
    [...queryKeys.catalogServices(tenantId), 'detail', serviceId] as const,
  branchServices: (tenantId: string, branchId: string) =>
    queryKeys.branch(tenantId, branchId, 'catalog-services'),
  branchServiceList: (
    tenantId: string,
    branchId: string,
    params: {
      search: string;
      categoryId: string;
      availability: 'all' | 'enabled' | 'disabled';
      includeInactive: boolean;
      page: number;
      pageSize: number;
    },
  ) => [...queryKeys.branchServices(tenantId, branchId), 'list', params] as const,
  branch: (tenantId: string, branchId: string, resource: string) =>
    ['tenant', tenantId, 'branch', branchId, resource] as const,
  serviceProviders: (tenantId: string) => ['tenant', tenantId, 'service-providers'] as const,
  serviceProviderList: (
    tenantId: string,
    params: {
      search: string;
      branchId: string;
      catalogServiceId: string;
      isActive: boolean;
      page: number;
      pageSize: number;
    },
  ) => [...queryKeys.serviceProviders(tenantId), 'list', params] as const,
  serviceProviderDetail: (tenantId: string, providerId: string) =>
    [...queryKeys.serviceProviders(tenantId), 'detail', providerId] as const,
  serviceProviderInvitations: (tenantId: string) =>
    [...queryKeys.serviceProviders(tenantId), 'invitations'] as const,
  serviceProviderInvitationList: (tenantId: string, page: number) =>
    [...queryKeys.serviceProviderInvitations(tenantId), 'list', { page }] as const,
  customers: (tenantId: string) => ['tenant', tenantId, 'customers'] as const,
  customerList: (
    tenantId: string,
    params: {
      search: string;
      status: 'ALL' | 'ACTIVE' | 'INACTIVE';
      page: number;
      pageSize: number;
    },
  ) => [...queryKeys.customers(tenantId), 'list', params] as const,
  customerDetail: (tenantId: string, customerId: string) =>
    [...queryKeys.customers(tenantId), 'detail', customerId] as const,
  visits: (tenantId: string, branchId: string) => queryKeys.branch(tenantId, branchId, 'visits'),
  visitList: (tenantId: string, branchId: string, params: object) =>
    [...queryKeys.visits(tenantId, branchId), 'list', params] as const,
  visitDetail: (tenantId: string, visitId: string) =>
    ['tenant', tenantId, 'visits', 'detail', visitId] as const,
  providerWorkToday: (tenantId: string, branchId: string, date: string) =>
    [...queryKeys.branch(tenantId, branchId, 'provider-work'), 'today', date] as const,
  eligibleProviders: (tenantId: string, branchId: string, serviceId: string) =>
    [...queryKeys.branch(tenantId, branchId, 'eligible-providers'), serviceId] as const,
  reports: (tenantId: string) => ['tenant', tenantId, 'reports'] as const,
  report: (tenantId: string, kind: string, params: object) =>
    [...queryKeys.reports(tenantId), kind, params] as const,
};
