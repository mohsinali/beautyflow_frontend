import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/query-client';
import {
  assignProviderBranch,
  assignProviderService,
  cancelProviderInvitation,
  createServiceProvider,
  getServiceProvider,
  listAssignableServices,
  listAvailableMemberships,
  listBranches,
  listProviderInvitations,
  listServiceProviders,
  listServiceProvidersForAssignment,
  removeProviderBranch,
  removeProviderPhoto,
  removeProviderService,
  resendProviderInvitation,
  resendManagedProviderInvitation,
  replaceProviderServices,
  setServiceProviderActive,
  updateServiceProvider,
  updateProviderInvitationEmail,
  uploadProviderPhoto,
} from '../api/service-providers-api';
import type {
  CreateProviderInput,
  ProviderProfileInput,
  ServiceProviderListParams,
} from '../types/service-provider';

export const useServiceProviders = (
  tenantId: string,
  params: ServiceProviderListParams,
  enabled: boolean,
) =>
  useQuery({
    queryKey: queryKeys.serviceProviderList(tenantId, params),
    queryFn: ({ signal }) => listServiceProviders(params, signal),
    enabled: Boolean(tenantId) && enabled,
    placeholderData: keepPreviousData,
  });

export const useServiceProvidersForAssignment = (
  tenantId: string,
  includeInactive: boolean,
  enabled: boolean,
) =>
  useQuery({
    queryKey: [...queryKeys.serviceProviders(tenantId), 'assignment-list', { includeInactive }],
    queryFn: ({ signal }) => listServiceProvidersForAssignment(includeInactive, signal),
    enabled: Boolean(tenantId) && enabled,
  });

export const useServiceProvider = (tenantId: string, providerId: string, enabled: boolean) =>
  useQuery({
    queryKey: queryKeys.serviceProviderDetail(tenantId, providerId),
    queryFn: ({ signal }) => getServiceProvider(providerId, signal),
    enabled: Boolean(tenantId && providerId) && enabled,
  });

export const useAvailableProviderMemberships = (tenantId: string, enabled: boolean) =>
  useQuery({
    queryKey: [...queryKeys.serviceProviders(tenantId), 'available-memberships'],
    queryFn: ({ signal }) => listAvailableMemberships(signal),
    enabled: Boolean(tenantId) && enabled,
  });

export const useProviderBranches = (tenantId: string, enabled: boolean) =>
  useQuery({
    queryKey: [...queryKeys.serviceProviders(tenantId), 'branches'],
    queryFn: ({ signal }) => listBranches(signal),
    enabled: Boolean(tenantId) && enabled,
  });

export const useAssignableProviderServices = (tenantId: string, enabled: boolean) =>
  useQuery({
    queryKey: [...queryKeys.serviceProviders(tenantId), 'assignable-services'],
    queryFn: ({ signal }) => listAssignableServices(signal),
    enabled: Boolean(tenantId) && enabled,
  });

function useProviderInvalidation(tenantId: string) {
  const client = useQueryClient();
  return (providerId?: string) =>
    Promise.all([
      client.invalidateQueries({ queryKey: queryKeys.serviceProviders(tenantId) }),
      ...(providerId
        ? [
            client.invalidateQueries({
              queryKey: queryKeys.serviceProviderDetail(tenantId, providerId),
            }),
          ]
        : []),
    ]);
}

export function useCreateServiceProvider(tenantId: string) {
  const invalidate = useProviderInvalidation(tenantId);
  return useMutation({
    mutationFn: (input: CreateProviderInput) => createServiceProvider(input),
    onSuccess: (result) => invalidate(result.provider.id),
  });
}
export function useResendProviderInvitation(tenantId: string, providerId: string) {
  const invalidate = useProviderInvalidation(tenantId);
  return useMutation({
    mutationFn: () => resendProviderInvitation(providerId),
    onSuccess: () => invalidate(providerId),
  });
}

export function useProviderInvitations(tenantId: string, page: number, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.serviceProviderInvitationList(tenantId, page),
    queryFn: ({ signal }) => listProviderInvitations(page, signal),
    enabled: Boolean(tenantId) && enabled,
    placeholderData: keepPreviousData,
  });
}

function useInvitationInvalidation(tenantId: string) {
  const client = useQueryClient();
  return () =>
    client.invalidateQueries({ queryKey: queryKeys.serviceProviderInvitations(tenantId) });
}

export function useResendManagedProviderInvitation(tenantId: string) {
  const invalidate = useInvitationInvalidation(tenantId);
  return useMutation({
    mutationFn: resendManagedProviderInvitation,
    onSuccess: invalidate,
  });
}

export function useUpdateProviderInvitationEmail(tenantId: string) {
  const invalidate = useInvitationInvalidation(tenantId);
  return useMutation({
    mutationFn: ({ invitationId, email }: { invitationId: string; email: string }) =>
      updateProviderInvitationEmail(invitationId, email),
    onSuccess: invalidate,
  });
}

export function useCancelProviderInvitation(tenantId: string) {
  const invalidate = useInvitationInvalidation(tenantId);
  return useMutation({
    mutationFn: cancelProviderInvitation,
    onSuccess: invalidate,
  });
}
export function useUpdateServiceProvider(tenantId: string) {
  const invalidate = useProviderInvalidation(tenantId);
  return useMutation({
    mutationFn: ({ providerId, input }: { providerId: string; input: ProviderProfileInput }) =>
      updateServiceProvider(providerId, input),
    onSuccess: (provider) => invalidate(provider.id),
  });
}
export function useSetServiceProviderActive(tenantId: string) {
  const invalidate = useProviderInvalidation(tenantId);
  return useMutation({
    mutationFn: ({ providerId, isActive }: { providerId: string; isActive: boolean }) =>
      setServiceProviderActive(providerId, isActive),
    onSuccess: (provider) => invalidate(provider.id),
  });
}
export function useReplaceProviderServices(tenantId: string, providerId: string) {
  const invalidate = useProviderInvalidation(tenantId);
  return useMutation({
    mutationFn: (serviceIds: string[]) => replaceProviderServices(providerId, serviceIds),
    onSuccess: () => invalidate(providerId),
  });
}
export function useAssignProviderService(tenantId: string, providerId: string) {
  const invalidate = useProviderInvalidation(tenantId);
  return useMutation({
    mutationFn: (serviceId: string) => assignProviderService(providerId, serviceId),
    onSuccess: () => invalidate(providerId),
  });
}
export function useRemoveProviderService(tenantId: string, providerId: string) {
  const invalidate = useProviderInvalidation(tenantId);
  return useMutation({
    mutationFn: (serviceId: string) => removeProviderService(providerId, serviceId),
    onSuccess: () => invalidate(providerId),
  });
}
export function useAssignProviderBranch(
  tenantId: string,
  providerId: string,
  membershipId: string,
) {
  const invalidate = useProviderInvalidation(tenantId);
  return useMutation({
    mutationFn: (branchId: string) => assignProviderBranch(membershipId, branchId),
    onSuccess: () => invalidate(providerId),
  });
}
export function useRemoveProviderBranch(
  tenantId: string,
  providerId: string,
  membershipId: string,
) {
  const invalidate = useProviderInvalidation(tenantId);
  return useMutation({
    mutationFn: (branchId: string) => removeProviderBranch(membershipId, branchId),
    onSuccess: () => invalidate(providerId),
  });
}
export function useUploadProviderPhoto(tenantId: string, providerId: string) {
  const invalidate = useProviderInvalidation(tenantId);
  return useMutation({
    mutationFn: (photo: File) => uploadProviderPhoto(providerId, photo),
    onSuccess: () => invalidate(providerId),
  });
}
export function useRemoveProviderPhoto(tenantId: string, providerId: string) {
  const invalidate = useProviderInvalidation(tenantId);
  return useMutation({
    mutationFn: () => removeProviderPhoto(providerId),
    onSuccess: () => invalidate(providerId),
  });
}
