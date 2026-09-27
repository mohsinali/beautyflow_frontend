export interface Branch {
  id: string;
  name: string;
  code: string;
  phone: string | null;
  address: string | null;
  timezone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BranchInput {
  name: string;
  timezone: string;
  address: string | null;
  phone: string | null;
}

export interface BranchList {
  items: Branch[];
  meta: { page: number; pageSize: number; total: number; pageCount: number };
}
