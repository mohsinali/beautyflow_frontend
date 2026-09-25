import type { PageMeta } from '@/features/service-categories/types/service-category';

export interface ProviderBranch {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

export interface ProviderService {
  id: string;
  name: string;
  code: string | null;
  isActive: boolean;
  category?: { id?: string; name?: string; isActive: boolean };
}

export interface ServiceProvider {
  id: string;
  membershipId: string;
  displayName: string;
  phone: string | null;
  jobTitle: string | null;
  bio: string | null;
  profileImageUrl: string | null;
  photoUrl: string | null;
  isActive: boolean;
  effectivelyActive: boolean;
  accountStatus:
    | 'INVITATION_PENDING'
    | 'INVITATION_SENT'
    | 'INVITATION_EXPIRED'
    | 'ACCOUNT_ACTIVE'
    | 'ACCOUNT_INACTIVE';
  createdAt: string;
  updatedAt: string;
  user: { id: string; email: string; firstName: string; lastName: string; status: string };
  membership: { id: string; status: string };
  assignedBranches: ProviderBranch[];
  qualifications: ProviderService[];
  qualifiedServiceCount: number;
}

export interface ServiceProviderListParams {
  search: string;
  branchId: string;
  catalogServiceId: string;
  isActive: boolean;
  page: number;
  pageSize: number;
}

export interface ServiceProviderList {
  items: ServiceProvider[];
  meta: PageMeta;
}

export interface AvailableProviderMembership {
  id: string;
  user: { email: string; firstName: string; lastName: string };
  branchAssignments: Array<{ branch: ProviderBranch }>;
}

export interface ProviderProfileInput {
  displayName: string;
  phone?: string | null;
  jobTitle?: string | null;
  bio?: string | null;
}

export interface CreateProviderInput extends ProviderProfileInput {
  email: string;
  isActive: boolean;
}

export interface OnboardProviderResult {
  provider: ServiceProvider;
  accountState: 'INVITATION_REQUIRED' | 'ACCOUNT_ACTIVE';
  invitationStatus: 'SENT' | 'PENDING';
}
