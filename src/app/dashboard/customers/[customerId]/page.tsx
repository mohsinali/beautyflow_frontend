import type { Metadata } from 'next';
import { CustomerDetail } from '@/features/customers/components/customer-detail';
export const metadata: Metadata = { title: 'Customer Profile' };
export default async function CustomerPage({
  params,
}: PageProps<'/dashboard/customers/[customerId]'>) {
  const { customerId } = await params;
  return <CustomerDetail customerId={customerId} />;
}
