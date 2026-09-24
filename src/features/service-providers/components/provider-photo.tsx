'use client';

import Image from 'next/image';
import { Camera, LoaderCircle, Trash2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/lib/api/error';
import { useRemoveProviderPhoto, useUploadProviderPhoto } from '../hooks/use-service-providers';
import type { ServiceProvider } from '../types/service-provider';
import { ProviderAvatar } from './provider-avatar';

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function ProviderPhoto({
  tenantId,
  provider,
  canEdit,
}: {
  tenantId: string;
  provider: ServiceProvider;
  canEdit: boolean;
}) {
  const t = useTranslations();
  const upload = useUploadProviderPhoto(tenantId, provider.id);
  const remove = useRemoveProviderPhoto(tenantId, provider.id);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);
  const safeError = (value: unknown) => {
    if (value instanceof ApiError && value.code === 'PROVIDER_PHOTO_TOO_LARGE')
      return t('providers.photoTooLarge');
    if (value instanceof ApiError && value.code === 'PROVIDER_PHOTO_TYPE_UNSUPPORTED')
      return t('providers.photoUnsupported');
    const message = t('providers.photoUploadFailed');
    return value instanceof ApiError && value.requestId
      ? `${message} ${t('errors.requestId', { id: value.requestId })}`
      : message;
  };
  function choose(next: File | undefined) {
    setError(null);
    if (!next) return;
    if (!TYPES.includes(next.type)) {
      setError(t('providers.photoUnsupported'));
      return;
    }
    if (next.size > MAX_BYTES) {
      setError(t('providers.photoTooLarge'));
      return;
    }
    setFile(next);
    setPreview(URL.createObjectURL(next));
  }
  async function save() {
    if (!file) return;
    try {
      await upload.mutateAsync(file);
      setFile(null);
      setPreview(null);
      toast.success(t('providers.photoUploaded'));
    } catch (value) {
      setError(safeError(value));
    }
  }
  async function removePhoto() {
    if (!window.confirm(t('providers.removePhotoMessage'))) return;
    try {
      await remove.mutateAsync();
      toast.success(t('providers.photoRemoved'));
    } catch {
      toast.error(t('providers.photoRemoveFailed'));
    }
  }
  const pending = upload.isPending || remove.isPending;
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
      <div className="relative">
        {preview ? (
          <span className="relative block size-24 overflow-hidden rounded-full">
            <Image
              src={preview}
              alt={t('providers.photoPreviewFor', { name: provider.displayName })}
              fill
              unoptimized
              className="object-cover"
            />
          </span>
        ) : (
          <ProviderAvatar name={provider.displayName} photoUrl={provider.photoUrl} size="lg" />
        )}
      </div>
      <div className="space-y-3">
        <div>
          <h2 className="font-semibold">{t('providers.providerPhoto')}</h2>
          <p className="text-sm text-muted-foreground">{t('providers.photoHint')}</p>
        </div>
        {canEdit && (
          <>
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold hover:bg-muted">
              <Camera className="size-4" />
              {provider.photoUrl ? t('providers.changePhoto') : t('providers.choosePhoto')}
              <Input
                className="sr-only"
                type="file"
                accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                onChange={(event) => choose(event.target.files?.[0])}
                disabled={pending}
              />
            </label>
            {file && (
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => void save()} disabled={pending}>
                  {upload.isPending && <LoaderCircle className="size-4 animate-spin" />}
                  {upload.isPending ? t('providers.uploading') : t('providers.uploadPhoto')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFile(null);
                    setPreview(null);
                  }}
                  disabled={pending}
                >
                  <X className="size-4" />
                  {t('common.cancel')}
                </Button>
              </div>
            )}
            {provider.photoUrl && !file && (
              <Button
                variant="ghost"
                className="text-destructive"
                onClick={() => void removePhoto()}
                disabled={pending}
              >
                <Trash2 className="size-4" />
                {t('providers.removePhoto')}
              </Button>
            )}
          </>
        )}
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
