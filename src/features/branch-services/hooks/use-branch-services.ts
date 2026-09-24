import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/query-client';
import { configureBranchService, listBranchServices } from '../api/branch-services-api';
import type { BranchServiceListParams, ConfigureBranchServiceInput } from '../types/branch-service';

export const branchServiceMutationKey = ['branch-service-configure'] as const;

export function useBranchServices(
  tenantId: string,
  branchId: string,
  params: BranchServiceListParams,
  enabled: boolean,
) {
  return useQuery({
    queryKey: queryKeys.branchServiceList(tenantId, branchId, params),
    queryFn: ({ signal }) => listBranchServices(branchId, params, signal),
    enabled: Boolean(tenantId && branchId) && enabled,
  });
}

export function useConfigureBranchService(tenantId: string, branchId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: branchServiceMutationKey,
    mutationFn: ({ serviceId, input }: { serviceId: string; input: ConfigureBranchServiceInput }) =>
      configureBranchService(branchId, serviceId, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.branchServices(tenantId, branchId) }),
  });
}
