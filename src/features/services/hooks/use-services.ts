import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/query-client';
import {
  createCatalogService,
  listCatalogServices,
  setCatalogServiceActive,
  updateCatalogService,
} from '../api/services-api';
import type {
  CatalogServiceListParams,
  CreateCatalogServiceInput,
  UpdateCatalogServiceInput,
} from '../types/catalog-service';

export function useCatalogServices(
  tenantId: string,
  params: CatalogServiceListParams,
  enabled: boolean,
) {
  return useQuery({
    queryKey: queryKeys.catalogServiceList(tenantId, params),
    queryFn: ({ signal }) => listCatalogServices(params, signal),
    enabled: Boolean(tenantId) && enabled,
    placeholderData: keepPreviousData,
  });
}

function useInvalidateCatalogServices(tenantId: string) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.catalogServices(tenantId) });
}

export function useCreateCatalogService(tenantId: string) {
  const invalidate = useInvalidateCatalogServices(tenantId);
  return useMutation({
    mutationFn: (input: CreateCatalogServiceInput) => createCatalogService(input),
    onSuccess: invalidate,
  });
}

export function useUpdateCatalogService(tenantId: string) {
  const invalidate = useInvalidateCatalogServices(tenantId);
  return useMutation({
    mutationFn: ({ serviceId, input }: { serviceId: string; input: UpdateCatalogServiceInput }) =>
      updateCatalogService(serviceId, input),
    onSuccess: invalidate,
  });
}

export function useSetCatalogServiceActive(tenantId: string) {
  const invalidate = useInvalidateCatalogServices(tenantId);
  return useMutation({
    mutationFn: ({ serviceId, isActive }: { serviceId: string; isActive: boolean }) =>
      setCatalogServiceActive(serviceId, isActive),
    onSuccess: invalidate,
  });
}
