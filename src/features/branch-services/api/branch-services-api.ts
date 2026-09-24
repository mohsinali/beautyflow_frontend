import { apiRequest } from '@/lib/api/client';
import type {
  BranchService,
  BranchServiceList,
  BranchServiceListParams,
  ConfigureBranchServiceInput,
} from '../types/branch-service';

interface Envelope<T> {
  data: T;
}

interface BackendList {
  items: BranchService[];
  meta: { page: number; pageSize: number; total: number; pageCount: number };
}

const BACKEND_PAGE_SIZE = 100;

async function loadStatus(
  branchId: string,
  params: BranchServiceListParams,
  isActive: boolean,
  signal?: AbortSignal,
) {
  const queryFor = (page: number) => {
    const query = new URLSearchParams({
      page: String(page),
      pageSize: String(BACKEND_PAGE_SIZE),
      isActive: String(isActive),
    });
    if (params.search) query.set('search', params.search);
    if (params.categoryId) query.set('categoryId', params.categoryId);
    return query;
  };
  const getPage = async (page: number) => {
    const response = await apiRequest<Envelope<BackendList>>(
      `/api/backend/branches/${branchId}/catalog-services?${queryFor(page).toString()}`,
      { signal },
    );
    return response.data;
  };

  const first = await getPage(1);
  if (first.meta.pageCount <= 1) return first.items;
  const remaining = await Promise.all(
    Array.from({ length: first.meta.pageCount - 1 }, (_, index) => getPage(index + 2)),
  );
  return [first, ...remaining].flatMap((page) => page.items);
}

export async function listBranchServices(
  branchId: string,
  params: BranchServiceListParams,
  signal?: AbortSignal,
): Promise<BranchServiceList> {
  const groups = await Promise.all([
    loadStatus(branchId, params, true, signal),
    ...(params.includeInactive ? [loadStatus(branchId, params, false, signal)] : []),
  ]);
  const allItems = [
    ...new Map(groups.flat().map((service) => [service.id, service])).values(),
  ].sort(
    (left, right) =>
      left.sortOrder - right.sortOrder ||
      left.name.localeCompare(right.name) ||
      left.id.localeCompare(right.id),
  );
  const filtered = allItems.filter((service) => {
    if (params.availability === 'enabled') return service.effectiveAvailability;
    if (params.availability === 'disabled') return !service.effectiveAvailability;
    return true;
  });
  const pageCount = Math.ceil(filtered.length / params.pageSize);
  const safePage = pageCount === 0 ? 1 : Math.min(params.page, pageCount);
  const start = (safePage - 1) * params.pageSize;
  return {
    items: filtered.slice(start, start + params.pageSize),
    allItems,
    meta: {
      page: safePage,
      pageSize: params.pageSize,
      total: filtered.length,
      pageCount,
    },
  };
}

export async function configureBranchService(
  branchId: string,
  serviceId: string,
  input: ConfigureBranchServiceInput,
) {
  const response = await apiRequest<Envelope<BranchService>>(
    `/api/backend/branches/${branchId}/catalog-services/${serviceId}`,
    { method: 'PUT', body: input },
  );
  return response.data;
}
