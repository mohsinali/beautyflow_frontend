import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createServiceCategory,
  listServiceCategories,
  setServiceCategoryActive,
  updateServiceCategory,
} from '../api/service-categories-api';
import { queryKeys } from '@/lib/api/query-client';
import type {
  CreateServiceCategoryInput,
  ServiceCategoryListParams,
  UpdateServiceCategoryInput,
} from '../types/service-category';

export function useServiceCategories(
  tenantId: string,
  params: ServiceCategoryListParams,
  enabled: boolean,
) {
  return useQuery({
    queryKey: queryKeys.serviceCategoryList(tenantId, params),
    queryFn: ({ signal }) => listServiceCategories(params, signal),
    enabled: Boolean(tenantId) && enabled,
    placeholderData: keepPreviousData,
  });
}

function useInvalidateCategories(tenantId: string) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.serviceCategories(tenantId) });
}

export function useCreateServiceCategory(tenantId: string) {
  const invalidate = useInvalidateCategories(tenantId);
  return useMutation({
    mutationFn: (input: CreateServiceCategoryInput) => createServiceCategory(input),
    onSuccess: invalidate,
  });
}

export function useUpdateServiceCategory(tenantId: string) {
  const invalidate = useInvalidateCategories(tenantId);
  return useMutation({
    mutationFn: ({
      categoryId,
      input,
    }: {
      categoryId: string;
      input: UpdateServiceCategoryInput;
    }) => updateServiceCategory(categoryId, input),
    onSuccess: invalidate,
  });
}

export function useSetServiceCategoryActive(tenantId: string) {
  const invalidate = useInvalidateCategories(tenantId);
  return useMutation({
    mutationFn: ({ categoryId, isActive }: { categoryId: string; isActive: boolean }) =>
      setServiceCategoryActive(categoryId, isActive),
    onSuccess: invalidate,
  });
}
