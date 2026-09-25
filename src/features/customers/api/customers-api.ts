import { apiRequest } from '@/lib/api/client';
import type { Customer, CustomerInput, CustomerList, CustomerListParams } from '../types/customer';

interface Envelope<T> {
  data: T;
}

export function listCustomers(params: CustomerListParams, signal?: AbortSignal) {
  const query = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
    status: params.status,
  });
  if (params.search) query.set('search', params.search);
  return apiRequest<Envelope<CustomerList>>(`/api/backend/customers?${query}`, { signal }).then(
    (value) => value.data,
  );
}
export const getCustomer = (id: string, signal?: AbortSignal) =>
  apiRequest<Envelope<Customer>>(`/api/backend/customers/${id}`, { signal }).then(
    (value) => value.data,
  );
export const createCustomer = (input: CustomerInput) =>
  apiRequest<Envelope<Customer>>('/api/backend/customers', { method: 'POST', body: input }).then(
    (value) => value.data,
  );
export const updateCustomer = (id: string, input: CustomerInput) =>
  apiRequest<Envelope<Customer>>(`/api/backend/customers/${id}`, {
    method: 'PATCH',
    body: input,
  }).then((value) => value.data);
export const setCustomerActive = (id: string, active: boolean) =>
  apiRequest<Envelope<Customer>>(
    `/api/backend/customers/${id}/${active ? 'reactivate' : 'deactivate'}`,
    { method: 'POST' },
  ).then((value) => value.data);
