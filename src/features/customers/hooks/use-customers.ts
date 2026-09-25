import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/query-client';
import {
  createCustomer,
  getCustomer,
  listCustomers,
  setCustomerActive,
  updateCustomer,
} from '../api/customers-api';
import type { CustomerInput, CustomerListParams } from '../types/customer';

export const useCustomers = (tenantId: string, params: CustomerListParams, enabled: boolean) =>
  useQuery({
    queryKey: queryKeys.customerList(tenantId, params),
    queryFn: ({ signal }) => listCustomers(params, signal),
    enabled: enabled && Boolean(tenantId),
  });
export const useCustomer = (tenantId: string, id: string, enabled: boolean) =>
  useQuery({
    queryKey: queryKeys.customerDetail(tenantId, id),
    queryFn: ({ signal }) => getCustomer(id, signal),
    enabled: enabled && Boolean(tenantId && id),
  });

function useInvalidate(tenantId: string) {
  const client = useQueryClient();
  return (id?: string) =>
    Promise.all([
      client.invalidateQueries({ queryKey: queryKeys.customers(tenantId) }),
      ...(id
        ? [client.invalidateQueries({ queryKey: queryKeys.customerDetail(tenantId, id) })]
        : []),
    ]);
}
export function useCreateCustomer(tenantId: string) {
  const invalidate = useInvalidate(tenantId);
  return useMutation({ mutationFn: createCustomer, onSuccess: (value) => invalidate(value.id) });
}
export function useUpdateCustomer(tenantId: string) {
  const invalidate = useInvalidate(tenantId);
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CustomerInput }) => updateCustomer(id, input),
    onSuccess: (value) => invalidate(value.id),
  });
}
export function useSetCustomerActive(tenantId: string) {
  const invalidate = useInvalidate(tenantId);
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => setCustomerActive(id, active),
    onSuccess: (value) => invalidate(value.id),
  });
}
