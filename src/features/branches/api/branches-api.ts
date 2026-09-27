import { apiRequest } from '@/lib/api/client';
import type { Branch, BranchInput, BranchList } from '../types/branch';

interface Envelope<T> {
  data: T;
}

export const listBranches = (page: number, signal?: AbortSignal) =>
  apiRequest<Envelope<BranchList>>(`/api/backend/branches?page=${page}&pageSize=20`, {
    signal,
  }).then((value) => value.data);

export const createBranch = (input: BranchInput) =>
  apiRequest<Envelope<Branch>>('/api/backend/branches', { method: 'POST', body: input }).then(
    (value) => value.data,
  );

export const updateBranch = (id: string, input: BranchInput) =>
  apiRequest<Envelope<Branch>>(`/api/backend/branches/${id}`, {
    method: 'PATCH',
    body: input,
  }).then((value) => value.data);

export const setBranchActive = (id: string, active: boolean) =>
  apiRequest<Envelope<Branch>>(
    `/api/backend/branches/${id}/${active ? 'reactivate' : 'deactivate'}`,
    { method: 'POST' },
  ).then((value) => value.data);
