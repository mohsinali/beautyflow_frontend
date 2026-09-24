'use client';

import type { ReactNode } from 'react';
import { usePermissions } from '@/providers/session-provider';

export function Can({
  permission,
  children,
  fallback = null,
}: {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { can } = usePermissions();
  return can(permission) ? children : fallback;
}
