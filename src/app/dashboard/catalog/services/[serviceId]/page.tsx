import type { Metadata } from 'next';
import { ServiceDetail } from '@/features/services/components/service-detail';

export const metadata: Metadata = { title: 'Service Details' };

export default async function ServicePage({
  params,
}: PageProps<'/dashboard/catalog/services/[serviceId]'>) {
  const { serviceId } = await params;
  return <ServiceDetail serviceId={serviceId} />;
}
