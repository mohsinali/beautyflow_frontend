import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/query-client';
import { createBranch, listBranches, setBranchActive, updateBranch } from '../api/branches-api';
import type { BranchInput } from '../types/branch';

export const useBranches = (tenantId: string, page: number, enabled: boolean) =>
  useQuery({
    queryKey: queryKeys.branchList(tenantId, page),
    queryFn: ({ signal }) => listBranches(page, signal),
    enabled: enabled && Boolean(tenantId),
  });

function useInvalidateBranches(tenantId: string) {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: queryKeys.branches(tenantId) });
}

export function useCreateBranch(tenantId: string) {
  const invalidate = useInvalidateBranches(tenantId);
  return useMutation({ mutationFn: createBranch, onSuccess: invalidate });
}

export function useUpdateBranch(tenantId: string) {
  const invalidate = useInvalidateBranches(tenantId);
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: BranchInput }) => updateBranch(id, input),
    onSuccess: invalidate,
  });
}

export function useSetBranchActive(tenantId: string) {
  const invalidate = useInvalidateBranches(tenantId);
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => setBranchActive(id, active),
    onSuccess: invalidate,
  });
}
