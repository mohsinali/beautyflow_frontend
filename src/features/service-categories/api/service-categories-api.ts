import { apiRequest } from '@/lib/api/client';
import type {
  CreateServiceCategoryInput,
  ServiceCategory,
  ServiceCategoryList,
  ServiceCategoryListParams,
  UpdateServiceCategoryInput,
} from '../types/service-category';

interface Envelope<T> {
  data: T;
}

export async function listServiceCategories(
  params: ServiceCategoryListParams,
  signal?: AbortSignal,
) {
  const query = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
    isActive: String(params.isActive),
  });
  if (params.search) query.set('search', params.search);
  const response = await apiRequest<Envelope<ServiceCategoryList>>(
    `/api/backend/service-categories?${query.toString()}`,
    { signal },
  );
  return response.data;
}

export async function createServiceCategory(input: CreateServiceCategoryInput) {
  const response = await apiRequest<Envelope<ServiceCategory>>('/api/backend/service-categories', {
    method: 'POST',
    body: input,
  });
  return response.data;
}

export async function updateServiceCategory(categoryId: string, input: UpdateServiceCategoryInput) {
  const response = await apiRequest<Envelope<ServiceCategory>>(
    `/api/backend/service-categories/${categoryId}`,
    { method: 'PATCH', body: input },
  );
  return response.data;
}

export async function setServiceCategoryActive(categoryId: string, isActive: boolean) {
  const action = isActive ? 'reactivate' : 'deactivate';
  const response = await apiRequest<Envelope<ServiceCategory>>(
    `/api/backend/service-categories/${categoryId}/${action}`,
    { method: 'POST' },
  );
  return response.data;
}
