import type { PageMeta } from '@/features/service-categories/types/service-category';

export interface CatalogServiceCategory {
  id: string;
  name: string;
  isActive: boolean;
}

export interface CatalogService {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  code: string | null;
  defaultPrice: string;
  durationMinutes: number | null;
  color: string | null;
  iconKey: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category: CatalogServiceCategory;
}

export interface CatalogServiceListParams {
  search: string;
  categoryId: string;
  isActive: boolean;
  page: number;
  pageSize: number;
}

export interface CatalogServiceList {
  items: CatalogService[];
  meta: PageMeta;
}

export interface CreateCatalogServiceInput {
  categoryId: string;
  name: string;
  description?: string;
  code?: string;
  defaultPrice: number;
  durationMinutes?: number;
  sortOrder?: number;
}

export interface UpdateCatalogServiceInput {
  categoryId?: string;
  name?: string;
  description?: string | null;
  code?: string | null;
  defaultPrice?: number;
  durationMinutes?: number | null;
  sortOrder?: number;
}
