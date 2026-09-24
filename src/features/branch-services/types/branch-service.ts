import type { CatalogService } from '@/features/services/types/catalog-service';
import type { PageMeta } from '@/features/service-categories/types/service-category';

export type BranchServiceAvailability = 'all' | 'enabled' | 'disabled';

export interface BranchService extends CatalogService {
  branchId: string;
  priceOverride: string | null;
  effectivePrice: string;
  availabilityOverride: boolean | null;
  effectiveAvailability: boolean;
}

export interface BranchServiceListParams {
  search: string;
  categoryId: string;
  availability: BranchServiceAvailability;
  includeInactive: boolean;
  page: number;
  pageSize: number;
}

export interface BranchServiceList {
  items: BranchService[];
  allItems: BranchService[];
  meta: PageMeta;
}

export interface ConfigureBranchServiceInput {
  isAvailable: boolean;
  priceOverride: string | null;
}
