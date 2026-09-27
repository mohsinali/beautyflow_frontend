import { apiRequest } from '@/lib/api/client';
import type {
  DashboardReport,
  ProviderPerformanceRow,
  ReportRange,
  ReportScope,
  SalonReport,
  ServicePerformanceRow,
} from '../types/report';

interface Envelope<T> {
  data: T;
}
const query = (params: object) => {
  const value = new URLSearchParams();
  Object.entries(params).forEach(([key, item]) =>
    typeof item === 'string' && item ? value.set(key, item) : undefined,
  );
  return value.toString();
};
export const getDashboardReport = (scope: ReportScope, signal?: AbortSignal) =>
  apiRequest<Envelope<DashboardReport>>(`/api/backend/reports/dashboard?${query(scope)}`, {
    signal,
  }).then((r) => r.data);
export const getSalonReport = (params: ReportRange, signal?: AbortSignal) =>
  apiRequest<Envelope<SalonReport>>(`/api/backend/reports/salon-performance?${query(params)}`, {
    signal,
  }).then((r) => r.data);
export const getProviderReport = (
  params: ReportRange & { providerId?: string },
  signal?: AbortSignal,
) =>
  apiRequest<Envelope<{ items: ProviderPerformanceRow[] }>>(
    `/api/backend/reports/provider-performance?${query(params)}`,
    { signal },
  ).then((r) => r.data);
export const getServiceReport = (
  params: ReportRange & { categoryId?: string; serviceId?: string },
  signal?: AbortSignal,
) =>
  apiRequest<Envelope<{ items: ServicePerformanceRow[] }>>(
    `/api/backend/reports/service-performance?${query(params)}`,
    { signal },
  ).then((r) => r.data);
