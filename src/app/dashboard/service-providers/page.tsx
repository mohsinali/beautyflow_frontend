import type { Metadata } from 'next';
import { ProviderList } from '@/features/service-providers/components/provider-list';

export const metadata: Metadata = { title: 'Service Providers' };

export default function ServiceProvidersPage() {
  return <ProviderList />;
}
