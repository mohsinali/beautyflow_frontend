import Image from 'next/image';
import { providerPhotoUrl } from '../api/service-providers-api';

export function ProviderAvatar({
  name,
  photoUrl,
  size = 'md',
}: {
  name: string;
  photoUrl: string | null;
  size?: 'md' | 'lg';
}) {
  const className = size === 'lg' ? 'size-24 text-2xl' : 'size-12 text-sm';
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toLocaleUpperCase();
  const source = providerPhotoUrl(photoUrl);
  return (
    <span
      className={`${className} relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-secondary/15 font-semibold text-secondary`}
    >
      {source ? (
        <Image
          src={source}
          alt={name}
          fill
          sizes={size === 'lg' ? '96px' : '48px'}
          unoptimized
          className="object-cover"
        />
      ) : (
        <span aria-hidden="true">{initials || '?'}</span>
      )}
    </span>
  );
}
