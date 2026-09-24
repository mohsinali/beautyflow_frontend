import type { Metadata } from 'next';
import { ProviderDetail } from '@/features/service-providers/components/provider-detail';

export const metadata: Metadata = { title: 'Provider Profile' };

export default async function ProviderPage({
  params,
}: PageProps<'/dashboard/service-providers/[providerId]'>) {
  const { providerId } = await params;
  return <ProviderDetail providerId={providerId} />;
}
