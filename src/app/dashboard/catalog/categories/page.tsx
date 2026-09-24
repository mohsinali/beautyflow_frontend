import type { Metadata } from 'next';
import { CategoryList } from '@/features/service-categories/components/category-list';

export const metadata: Metadata = { title: 'Service Categories' };

export default function ServiceCategoriesPage() {
  return <CategoryList />;
}
