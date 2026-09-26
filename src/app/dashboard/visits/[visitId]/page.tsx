import type { Metadata } from 'next';
import { VisitDetailScreen } from '@/features/visits/components/visit-detail';
export const metadata: Metadata = { title: 'Visit' };
export default async function VisitPage({ params }: { params: Promise<{ visitId: string }> }) {
  const { visitId } = await params;
  return <VisitDetailScreen visitId={visitId} />;
}
