import type { Metadata } from 'next';
import { VisitListScreen } from '@/features/visits/components/visit-list';
export const metadata: Metadata = { title: 'Visits' };
export default function VisitsPage() {
  return <VisitListScreen />;
}
