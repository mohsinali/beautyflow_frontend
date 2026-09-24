import { apiRequest } from '@/lib/api/client';
import type { CatalogServiceList } from '@/features/services/types/catalog-service';
import type {
  AvailableProviderMembership,
  CreateProviderInput,
  ProviderBranch,
  ProviderProfileInput,
  ProviderService,
  ServiceProvider,
  ServiceProviderList,
  ServiceProviderListParams,
} from '../types/service-provider';

interface Envelope<T> {
  data: T;
}

export async function listServiceProviders(
  params: ServiceProviderListParams,
  signal?: AbortSignal,
) {
  const query = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
    isActive: String(params.isActive),
  });
  if (params.search) query.set('search', params.search);
  if (params.branchId) query.set('branchId', params.branchId);
  if (params.catalogServiceId) query.set('catalogServiceId', params.catalogServiceId);
  return apiRequest<Envelope<ServiceProviderList>>(`/api/backend/service-providers?${query}`, {
    signal,
  }).then((value) => value.data);
}

export const getServiceProvider = (providerId: string, signal?: AbortSignal) =>
  apiRequest<Envelope<ServiceProvider>>(`/api/backend/service-providers/${providerId}`, {
    signal,
  }).then((value) => value.data);

export const listAvailableMemberships = (signal?: AbortSignal) =>
  apiRequest<Envelope<AvailableProviderMembership[]>>(
    '/api/backend/service-providers/available-memberships',
    { signal },
  ).then((value) => value.data);

export const createServiceProvider = (input: CreateProviderInput) =>
  apiRequest<Envelope<ServiceProvider>>('/api/backend/service-providers', {
    method: 'POST',
    body: input,
  }).then((value) => value.data);

export const updateServiceProvider = (providerId: string, input: ProviderProfileInput) =>
  apiRequest<Envelope<ServiceProvider>>(`/api/backend/service-providers/${providerId}`, {
    method: 'PATCH',
    body: input,
  }).then((value) => value.data);

export const setServiceProviderActive = (providerId: string, isActive: boolean) =>
  apiRequest<Envelope<ServiceProvider>>(
    `/api/backend/service-providers/${providerId}/${isActive ? 'reactivate' : 'deactivate'}`,
    { method: 'POST' },
  ).then((value) => value.data);

export const replaceProviderServices = (providerId: string, serviceIds: string[]) =>
  apiRequest<Envelope<ProviderService[]>>(
    `/api/backend/service-providers/${providerId}/qualifications`,
    { method: 'PUT', body: { serviceIds } },
  ).then((value) => value.data);

export const assignProviderService = (providerId: string, serviceId: string) =>
  apiRequest<Envelope<ProviderService[]>>(
    `/api/backend/service-providers/${providerId}/qualifications/${serviceId}`,
    { method: 'POST' },
  ).then((value) => value.data);

export const removeProviderService = (providerId: string, serviceId: string) =>
  apiRequest<Envelope<ProviderService[]>>(
    `/api/backend/service-providers/${providerId}/qualifications/${serviceId}`,
    { method: 'DELETE' },
  ).then((value) => value.data);

export const assignProviderBranch = (membershipId: string, branchId: string) =>
  apiRequest<Envelope<unknown>>(`/api/backend/memberships/${membershipId}/branches/${branchId}`, {
    method: 'POST',
  });

export const removeProviderBranch = (membershipId: string, branchId: string) =>
  apiRequest<Envelope<unknown>>(`/api/backend/memberships/${membershipId}/branches/${branchId}`, {
    method: 'DELETE',
  });

export async function listBranches(signal?: AbortSignal) {
  const items: ProviderBranch[] = [];
  let page = 1;
  let pageCount = 1;
  do {
    const response = await apiRequest<
      Envelope<{ items: ProviderBranch[]; meta: { pageCount: number } }>
    >(`/api/backend/branches?page=${page}&pageSize=100`, { signal });
    items.push(...response.data.items);
    pageCount = response.data.meta.pageCount;
    page += 1;
  } while (page <= pageCount);
  return items;
}

export async function listAssignableServices(signal?: AbortSignal) {
  const items: CatalogServiceList['items'] = [];
  let page = 1;
  let pageCount = 1;
  do {
    const response = await apiRequest<Envelope<CatalogServiceList>>(
      `/api/backend/catalog-services?page=${page}&pageSize=100&isActive=true`,
      { signal },
    );
    items.push(...response.data.items);
    pageCount = response.data.meta.pageCount;
    page += 1;
  } while (page <= pageCount);
  return items;
}

export const uploadProviderPhoto = (providerId: string, photo: File) => {
  const body = new FormData();
  body.set('photo', photo);
  return apiRequest<Envelope<{ id: string; photoUrl: string }>>(
    `/api/backend/service-providers/${providerId}/photo`,
    { method: 'POST', body },
  ).then((value) => value.data);
};

export const removeProviderPhoto = (providerId: string) =>
  apiRequest<Envelope<{ id: string; photoUrl: null }>>(
    `/api/backend/service-providers/${providerId}/photo`,
    { method: 'DELETE' },
  ).then((value) => value.data);

export function providerPhotoUrl(value: string | null) {
  return value?.startsWith('/service-providers/') ? `/api/backend${value}` : value;
}
