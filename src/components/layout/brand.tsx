import { Flower2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Brand({ compact = false, dark = false }: { compact?: boolean; dark?: boolean }) {
  return (
    <div
      className={cn('flex items-center gap-3', dark ? 'text-sidebar-foreground' : 'text-primary')}
    >
      <span
        className={cn(
          'grid size-10 shrink-0 place-items-center rounded-xl',
          dark ? 'bg-white/10' : 'bg-muted',
        )}
      >
        <Flower2 className="size-5" aria-hidden="true" />
      </span>
      {!compact && (
        <span className="font-display text-xl font-semibold tracking-tight">BeautyFlow</span>
      )}
    </div>
  );
}
