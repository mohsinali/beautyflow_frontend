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
import { useSetCustomerActive } from '../hooks/use-customers';
import type { Customer } from '../types/customer';

export function CustomerStatusDialog({
  tenantId,
  customer,
  onOpenChange,
}: {
  tenantId: string;
  customer: Customer | null;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations();
  const mutation = useSetCustomerActive(tenantId);
  if (!customer) return null;
  const activate = !customer.isActive;
  async function confirm() {
    try {
      await mutation.mutateAsync({ id: customer!.id, active: activate });
      toast.success(t(activate ? 'customers.activated' : 'customers.deactivated'));
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof ApiError && error.code === 'CUSTOMER_PHONE_EXISTS'
          ? t('customers.phoneExistsActivate')
          : t('customers.statusFailed');
      toast.error(message);
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(value) => {
        if (!mutation.isPending) onOpenChange(value);
      }}
    >
      <DialogContent closeLabel={t('common.close')}>
        <DialogTitle className="pe-8 font-display text-xl font-semibold">
          {t(activate ? 'customers.activate' : 'customers.deactivate')}
        </DialogTitle>
        <DialogDescription className="mt-3 leading-6 text-muted-foreground">
          {t(activate ? 'customers.activateMessage' : 'customers.deactivateMessage')}
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
            {t(activate ? 'customers.activate' : 'customers.deactivate')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
