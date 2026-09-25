'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { apiRequest, resetRefreshCoordinator } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-client';
import type { BranchSummary, Session } from '@/types/session';

interface SessionEnvelope {
  data: Session;
}

interface SessionContextValue {
  session: Session | null;
  isLoading: boolean;
  error: Error | null;
  activeBranch: BranchSummary | null;
  setActiveBranch: (id: string) => void;
  refreshSession: () => Promise<void>;
  logout: (all?: boolean) => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);
const PUBLIC_SESSION_ROUTES = new Set(['/login', '/accept-invitation']);

export function isPublicSessionRoute(pathname: string): boolean {
  return PUBLIC_SESSION_ROUTES.has(pathname);
}

function storageKey(session: Session) {
  return session.tenant ? `beautyflow:branch:${session.user.id}:${session.tenant.id}` : null;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isPublicRoute = isPublicSessionRoute(pathname);
  const queryClient = useQueryClient();
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const sessionQuery = useQuery({
    queryKey: queryKeys.session,
    queryFn: () =>
      apiRequest<SessionEnvelope>('/api/auth/session', {}, false).then((result) => result.data),
    retry: false,
    staleTime: 60_000,
    enabled: !isPublicRoute,
  });

  const activeBranch = useMemo(() => {
    const session = sessionQuery.data;
    if (!session) return null;
    const key = storageKey(session);
    const storedId = key && typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
    return (
      session.accessibleBranches.find((branch) => branch.id === selectedBranchId) ??
      session.accessibleBranches.find((branch) => branch.id === storedId) ??
      (session.accessibleBranches.length === 1 ? session.accessibleBranches[0] : null)
    );
  }, [selectedBranchId, sessionQuery.data]);

  useEffect(() => {
    const session = sessionQuery.data;
    if (!session) return;
    const key = storageKey(session);
    if (!key) return;
    const storedId = window.localStorage.getItem(key);
    if (storedId && !session.accessibleBranches.some((branch) => branch.id === storedId)) {
      window.localStorage.removeItem(key);
    }
    if (activeBranch) window.localStorage.setItem(key, activeBranch.id);
  }, [activeBranch, sessionQuery.data]);

  useEffect(() => {
    if (!isPublicRoute && !sessionQuery.isLoading && sessionQuery.isError) {
      router.replace('/login?reason=expired');
    }
  }, [isPublicRoute, router, sessionQuery.isError, sessionQuery.isLoading]);

  const setActiveBranch = useCallback(
    (id: string) => {
      const session = sessionQuery.data;
      const branch = session?.accessibleBranches.find((item) => item.id === id) ?? null;
      if (!session || !branch) return;
      setSelectedBranchId(branch.id);
      const key = storageKey(session);
      if (key) window.localStorage.setItem(key, branch.id);
      void queryClient.invalidateQueries({ queryKey: ['tenant', session.tenant?.id, 'branch'] });
    },
    [queryClient, sessionQuery.data],
  );

  const refreshSession = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.session });
  }, [queryClient]);

  const logout = useCallback(
    async (all = false) => {
      try {
        await apiRequest(
          all ? '/api/auth/logout-all' : '/api/auth/logout',
          { method: 'POST' },
          false,
        );
      } finally {
        resetRefreshCoordinator();
        setSelectedBranchId(null);
        queryClient.clear();
        router.replace('/login');
        router.refresh();
      }
    },
    [queryClient, router],
  );

  const value = useMemo<SessionContextValue>(
    () => ({
      session: sessionQuery.data ?? null,
      isLoading: sessionQuery.isLoading,
      error: sessionQuery.error,
      activeBranch,
      setActiveBranch,
      refreshSession,
      logout,
    }),
    [
      activeBranch,
      logout,
      refreshSession,
      sessionQuery.data,
      sessionQuery.error,
      sessionQuery.isLoading,
      setActiveBranch,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used within SessionProvider');
  return context;
}

export function useCurrentTenant() {
  return useSession().session?.tenant ?? null;
}

export function useActiveBranch() {
  const { activeBranch, setActiveBranch } = useSession();
  return { activeBranch, setActiveBranch };
}

export function usePermissions() {
  const values = useSession().session?.permissions ?? [];
  return { permissions: values, can: (permission: string) => values.includes(permission) };
}
