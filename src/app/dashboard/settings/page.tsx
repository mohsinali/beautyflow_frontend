import type { Metadata } from 'next';
import { SettingsContent } from '@/features/tenant-settings/components/settings-content';

export const metadata: Metadata = { title: 'Settings' };

export default function SettingsPage() {
  return <SettingsContent />;
}
