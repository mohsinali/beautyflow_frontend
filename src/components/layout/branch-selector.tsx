'use client';

import { MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSession } from '@/providers/session-provider';

export function BranchSelector() {
  const t = useTranslations();
  const { session, activeBranch, setActiveBranch } = useSession();
  if (!session?.tenant || session.accessibleBranches.length === 0) return null;
  if (session.accessibleBranches.length === 1) {
    return (
      <div
        className="flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm"
        aria-label={t('header.branch')}
      >
        <MapPin className="size-4 text-secondary" />
        <span className="max-w-36 truncate">{session.accessibleBranches[0].name}</span>
      </div>
    );
  }
  return (
    <label className="relative flex min-h-11 items-center rounded-xl border border-border bg-card ps-9 text-sm shadow-sm focus-within:ring-2 focus-within:ring-ring/35">
      <MapPin
        className="pointer-events-none absolute start-3 size-4 text-secondary"
        aria-hidden="true"
      />
      <span className="sr-only">{t('header.branch')}</span>
      <select
        className="min-h-10 max-w-44 appearance-none bg-transparent pe-8 outline-none"
        value={activeBranch?.id ?? ''}
        onChange={(event) => setActiveBranch(event.target.value)}
      >
        <option value="">{t('common.selectBranch')}</option>
        {session.accessibleBranches.map((branch) => (
          <option value={branch.id} key={branch.id}>
            {branch.name}
          </option>
        ))}
      </select>
    </label>
  );
}
