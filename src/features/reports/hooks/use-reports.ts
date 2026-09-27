'use client';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/query-client';
import {
  getDashboardReport,
  getProviderReport,
  getSalonReport,
  getServiceReport,
} from '../api/reports-api';
import type { ReportRange, ReportScope } from '../types/report';

export const useDashboardReport = (tenantId: string, scope: ReportScope, enabled = true) =>
  useQuery({
    queryKey: queryKeys.report(tenantId, 'dashboard', scope),
    queryFn: ({ signal }) => getDashboardReport(scope, signal),
    enabled: Boolean(tenantId) && enabled,
  });
export const useSalonReport = (tenantId: string, params: ReportRange, enabled = true) =>
  useQuery({
    queryKey: queryKeys.report(tenantId, 'salon', params),
    queryFn: ({ signal }) => getSalonReport(params, signal),
    enabled: Boolean(tenantId) && enabled,
  });
export const useProviderReport = (
  tenantId: string,
  params: ReportRange & { providerId?: string },
  enabled = true,
) =>
  useQuery({
    queryKey: queryKeys.report(tenantId, 'providers', params),
    queryFn: ({ signal }) => getProviderReport(params, signal),
    enabled: Boolean(tenantId) && enabled,
  });
export const useServiceReport = (
  tenantId: string,
  params: ReportRange & { categoryId?: string; serviceId?: string },
  enabled = true,
) =>
  useQuery({
    queryKey: queryKeys.report(tenantId, 'services', params),
    queryFn: ({ signal }) => getServiceReport(params, signal),
    enabled: Boolean(tenantId) && enabled,
  });
