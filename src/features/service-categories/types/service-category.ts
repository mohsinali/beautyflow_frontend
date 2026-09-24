export interface ServiceCategory {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  iconKey: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceCategoryListParams {
  search: string;
  isActive: boolean;
  page: number;
  pageSize: number;
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
}

export interface ServiceCategoryList {
  items: ServiceCategory[];
  meta: PageMeta;
}

export interface CreateServiceCategoryInput {
  name: string;
  description?: string;
  color?: string;
  iconKey?: string;
  sortOrder?: number;
}

export interface UpdateServiceCategoryInput {
  name?: string;
  description?: string | null;
  color?: string | null;
  iconKey?: string | null;
  sortOrder?: number;
}
