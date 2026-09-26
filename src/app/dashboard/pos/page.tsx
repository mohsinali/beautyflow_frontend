import type { Metadata } from 'next';
import { PosScreen } from '@/features/visits/components/pos-screen';
export const metadata: Metadata = { title: 'POS' };
export default async function PosPage({
  searchParams,
}: {
  searchParams: Promise<{ visitId?: string }>;
}) {
  const { visitId } = await searchParams;
  return <PosScreen visitId={visitId} />;
}
