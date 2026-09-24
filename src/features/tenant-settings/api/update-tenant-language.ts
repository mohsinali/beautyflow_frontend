import { apiRequest } from '@/lib/api/client';
import type { TenantLanguage, TenantSettings } from '@/types/session';

interface TenantSettingsEnvelope {
  data: TenantSettings;
}

export async function updateTenantLanguage(language: TenantLanguage) {
  const response = await apiRequest<TenantSettingsEnvelope>('/api/backend/tenant/settings', {
    method: 'PATCH',
    body: { defaultLanguage: language },
  });
  return response.data;
}
