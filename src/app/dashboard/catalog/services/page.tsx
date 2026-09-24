import type { Metadata } from 'next';
import { ServicesList } from '@/features/services/components/services-list';

export const metadata: Metadata = { title: 'Services' };

export default function ServicesPage() {
  return <ServicesList />;
}
