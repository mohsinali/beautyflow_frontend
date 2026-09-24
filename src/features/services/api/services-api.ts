import { apiRequest } from '@/lib/api/client';
import type {
  CatalogService,
  CatalogServiceList,
  CatalogServiceListParams,
  CreateCatalogServiceInput,
  UpdateCatalogServiceInput,
} from '../types/catalog-service';

interface Envelope<T> {
  data: T;
}

export async function listCatalogServices(params: CatalogServiceListParams, signal?: AbortSignal) {
  const query = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
    isActive: String(params.isActive),
  });
  if (params.search) query.set('search', params.search);
  if (params.categoryId) query.set('categoryId', params.categoryId);
  const response = await apiRequest<Envelope<CatalogServiceList>>(
    `/api/backend/catalog-services?${query.toString()}`,
    { signal },
  );
  return response.data;
}

export async function createCatalogService(input: CreateCatalogServiceInput) {
  const response = await apiRequest<Envelope<CatalogService>>('/api/backend/catalog-services', {
    method: 'POST',
    body: input,
  });
  return response.data;
}

export async function updateCatalogService(serviceId: string, input: UpdateCatalogServiceInput) {
  const response = await apiRequest<Envelope<CatalogService>>(
    `/api/backend/catalog-services/${serviceId}`,
    { method: 'PATCH', body: input },
  );
  return response.data;
}

export async function setCatalogServiceActive(serviceId: string, isActive: boolean) {
  const action = isActive ? 'reactivate' : 'deactivate';
  const response = await apiRequest<Envelope<CatalogService>>(
    `/api/backend/catalog-services/${serviceId}/${action}`,
    { method: 'POST' },
  );
  return response.data;
}
