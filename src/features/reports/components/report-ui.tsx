'use client';
import type { ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BranchSummary } from '@/types/session';

export function BranchScope({
  branches,
  value,
  onChange,
}: {
  branches: BranchSummary[];
  value: string;
  onChange: (value: string) => void;
}) {
  const t = useTranslations('reports');
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      <span>{t('branch')}</span>
      <select
        className="h-10 rounded-lg border border-input bg-background px-3"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="all">{t('allBranches')}</option>
        {branches.map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.name}
          </option>
        ))}
      </select>
    </label>
  );
}
export function Money({ value, currency }: { value: string | null; currency: string }) {
  const locale = useLocale();
  if (value === null) return <>—</>;
  return (
    <>{new Intl.NumberFormat(locale, { style: 'currency', currency }).format(Number(value))}</>
  );
}
export function MetricCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Card>
      <CardContent className="pt-5 sm:pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-semibold tabular-nums">{children}</p>
      </CardContent>
    </Card>
  );
}
export function ReportState({
  loading,
  error,
  empty,
  children,
}: {
  loading: boolean;
  error: boolean;
  empty?: boolean;
  children: ReactNode;
}) {
  const t = useTranslations('reports');
  if (loading)
    return (
      <div className="rounded-xl border p-8 text-center text-muted-foreground" role="status">
        {t('loading')}
      </div>
    );
  if (error)
    return (
      <div
        className="rounded-xl border border-destructive/30 p-8 text-center text-destructive"
        role="alert"
      >
        {t('loadFailed')}
      </div>
    );
  if (empty)
    return (
      <div className="rounded-xl border p-8 text-center text-muted-foreground">{t('empty')}</div>
    );
  return <>{children}</>;
}
export function RankedList({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}
