import { apiRequest } from '@/lib/api/client';
import type { ServiceProviderList } from '@/features/service-providers/types/service-provider';
import type {
  CreateVisitInput,
  Visit,
  VisitItem,
  VisitItemInput,
  VisitList,
  ProviderWorkItem,
  VisitStatus,
  PaymentStatus,
} from '../types/visit';
interface Envelope<T> {
  data: T;
}
export const listVisits = (
  branchId: string,
  params: {
    page: number;
    pageSize: number;
    status?: VisitStatus;
    paymentStatus?: PaymentStatus;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  },
  signal?: AbortSignal,
) => {
  const query = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
  });
  if (params.status) query.set('status', params.status);
  if (params.paymentStatus) query.set('paymentStatus', params.paymentStatus);
  if (params.search) query.set('search', params.search);
  if (params.dateFrom) query.set('dateFrom', params.dateFrom);
  if (params.dateTo) query.set('dateTo', params.dateTo);
  return apiRequest<Envelope<VisitList>>(`/api/backend/visits?${query}`, { branchId, signal }).then(
    (r) => r.data,
  );
};
export const getMyWork = (branchId: string, date: string, signal?: AbortSignal) =>
  apiRequest<Envelope<ProviderWorkItem[]>>(
    `/api/backend/visits/my-work?date=${encodeURIComponent(date)}`,
    { branchId, signal },
  ).then((r) => r.data);
export const getVisit = (id: string, signal?: AbortSignal) =>
  apiRequest<Envelope<Visit>>(`/api/backend/visits/${id}`, { signal }).then((r) => r.data);
export const createVisit = (branchId: string, input: CreateVisitInput) =>
  apiRequest<Envelope<Visit>>('/api/backend/visits', {
    method: 'POST',
    branchId,
    body: input,
  }).then((r) => r.data);
export const transitionVisit = (id: string, action: 'start' | 'complete' | 'cancel') =>
  apiRequest<Envelope<Visit>>(`/api/backend/visits/${id}/${action}`, { method: 'POST' }).then(
    (r) => r.data,
  );
export const markVisitPaid = (id: string, paymentNote?: string) =>
  apiRequest<Envelope<Visit>>(`/api/backend/visits/${id}/mark-paid`, {
    method: 'POST',
    body: { paymentNote },
  }).then((r) => r.data);
export const transitionVisitItem = (
  visitId: string,
  itemId: string,
  action: 'start' | 'complete' | 'cancel',
) =>
  apiRequest<Envelope<Visit>>(`/api/backend/visits/${visitId}/items/${itemId}/${action}`, {
    method: 'POST',
  }).then((r) => r.data);
export const eligibleProviders = (branchId: string, serviceId: string, signal?: AbortSignal) =>
  apiRequest<Envelope<ServiceProviderList>>(
    `/api/backend/service-providers?page=1&pageSize=100&isActive=true&branchId=${encodeURIComponent(branchId)}&catalogServiceId=${encodeURIComponent(serviceId)}`,
    { branchId, signal },
  ).then((r) => r.data.items);
export const updateVisit = (
  id: string,
  input: { customerId?: string; defaultProviderId?: string | null; notes?: string | null },
) =>
  apiRequest<Envelope<Visit>>(`/api/backend/visits/${id}`, { method: 'PATCH', body: input }).then(
    (r) => r.data,
  );
export const addVisitItem = (visitId: string, input: VisitItemInput) =>
  apiRequest<Envelope<VisitItem>>(`/api/backend/visits/${visitId}/items`, {
    method: 'POST',
    body: input,
  }).then((r) => r.data);
export const updateVisitItem = (
  visitId: string,
  itemId: string,
  input: { providerId?: string | null; chargedPrice?: string; discountAmount?: string },
) =>
  apiRequest<Envelope<VisitItem>>(`/api/backend/visits/${visitId}/items/${itemId}`, {
    method: 'PATCH',
    body: input,
  }).then((r) => r.data);
export const removeVisitItem = (visitId: string, itemId: string) =>
  apiRequest<Envelope<Visit>>(`/api/backend/visits/${visitId}/items/${itemId}`, {
    method: 'DELETE',
  }).then((r) => r.data);
