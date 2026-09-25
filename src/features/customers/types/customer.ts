export interface CustomerBranch {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}
export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  isActive: boolean;
  preferredBranch: CustomerBranch | null;
  createdAt: string;
  updatedAt: string;
}
export interface CustomerList {
  items: Customer[];
  meta: { page: number; pageSize: number; total: number; pageCount: number };
}
export type CustomerStatus = 'ALL' | 'ACTIVE' | 'INACTIVE';
export interface CustomerListParams {
  search: string;
  status: CustomerStatus;
  page: number;
  pageSize: number;
}
export interface CustomerInput {
  name: string;
  phone?: string | null;
  notes?: string | null;
  preferredBranchId?: string | null;
}
