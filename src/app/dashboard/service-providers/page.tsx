import type { Metadata } from 'next';
import { ProviderList } from '@/features/service-providers/components/provider-list';
import { ProviderInvitationList } from '@/features/service-providers/components/provider-invitation-list';

export const metadata: Metadata = { title: 'Service Providers' };

export default async function ServiceProvidersPage({
  searchParams,
}: PageProps<'/dashboard/service-providers'>) {
  return (await searchParams).view === 'invitations' ? (
    <ProviderInvitationList />
  ) : (
    <ProviderList />
  );
}
