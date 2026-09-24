import type { Metadata } from 'next';
import { BranchServicesList } from '@/features/branch-services/components/branch-services-list';

export const metadata: Metadata = { title: 'Branch Services' };

export default function BranchServicesPage() {
  return <BranchServicesList />;
}
