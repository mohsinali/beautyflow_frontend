import type { Customer } from '@/features/customers/types/customer';

export type VisitStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type VisitItemStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export interface VisitItem {
  id: string;
  catalogServiceId: string;
  serviceNameSnapshot: string;
  providerId: string | null;
  provider: { id: string; displayName: string } | null;
  originalPrice: string;
  chargedPrice: string;
  discountAmount: string;
  finalAmount: string;
  status: VisitItemStatus;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
}
export interface Visit {
  id: string;
  status: VisitStatus;
  customer: Pick<Customer, 'id' | 'name' | 'phone'>;
  branch: { id: string; name: string; code: string };
  defaultProvider: { id: string; displayName: string } | null;
  items: VisitItem[];
  subtotal: string;
  discountAmount: string;
  total: string;
  notes: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
}
export interface VisitList {
  items: Visit[];
  meta: { page: number; pageSize: number; total: number; pageCount: number };
}
export interface VisitItemInput {
  catalogServiceId: string;
  providerId?: string | null;
  chargedPrice?: string;
  discountAmount?: string;
}
export interface ProviderWorkItem {
  id: string;
  visitId: string;
  serviceNameSnapshot: string;
  status: VisitItemStatus;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  visit: { customer: { id: string; name: string } };
}
export interface CreateVisitInput {
  customerId: string;
  defaultProviderId?: string | null;
  notes?: string;
  status: 'DRAFT' | 'IN_PROGRESS';
  items: VisitItemInput[];
}
