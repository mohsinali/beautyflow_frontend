import type { Metadata } from 'next';
import { VisitReceiptScreen } from '@/features/visits/components/visit-receipt';

export const metadata: Metadata = { title: 'Receipt' };

export default async function ReceiptPage({ params }: { params: Promise<{ visitId: string }> }) {
  const { visitId } = await params;
  return <VisitReceiptScreen visitId={visitId} />;
}
