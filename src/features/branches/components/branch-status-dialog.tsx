'use client';

import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { ApiError } from '@/lib/api/error';
import { useSession } from '@/providers/session-provider';
import { useSetBranchActive } from '../hooks/use-branches';
import type { Branch } from '../types/branch';

export function BranchStatusDialog({
  tenantId,
  branch,
  onOpenChange,
}: {
  tenantId: string;
  branch: Branch | null;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations();
  const { refreshSession } = useSession();
  const mutation = useSetBranchActive(tenantId);
  if (!branch) return null;
  const activate = !branch.isActive;

  async function confirm() {
    try {
      await mutation.mutateAsync({ id: branch!.id, active: activate });
      await refreshSession();
      toast.success(t(activate ? 'branches.activated' : 'branches.deactivated'));
      onOpenChange(false);
    } catch (error) {
      let message = t('branches.statusFailed');
      if (error instanceof ApiError && error.requestId)
        message += ` ${t('errors.requestId', { id: error.requestId })}`;
      toast.error(message);
    }
  }

  return (
    <Dialog open onOpenChange={(value) => !mutation.isPending && onOpenChange(value)}>
      <DialogContent closeLabel={t('common.close')}>
        <DialogTitle className="pe-8 font-display text-xl font-semibold">
          {t(activate ? 'branches.activate' : 'branches.deactivate')}
        </DialogTitle>
        <DialogDescription className="mt-3 leading-6 text-muted-foreground">
          {t(activate ? 'branches.activateMessage' : 'branches.deactivateMessage')}
        </DialogDescription>
        <div className="mt-6 flex justify-end gap-3">
          <DialogClose asChild>
            <Button variant="outline" disabled={mutation.isPending}>
              {t('common.cancel')}
            </Button>
          </DialogClose>
          <Button
            variant={activate ? 'default' : 'destructive'}
            disabled={mutation.isPending}
            onClick={confirm}
          >
            {mutation.isPending && <LoaderCircle className="size-4 animate-spin" />}
            {t(activate ? 'branches.activate' : 'branches.deactivate')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
