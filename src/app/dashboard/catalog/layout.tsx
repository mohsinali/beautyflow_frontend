import type { ReactNode } from 'react';
import { CatalogNavigation } from '@/components/navigation/catalog-navigation';

export default function CatalogLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <CatalogNavigation />
      {children}
    </div>
  );
}
