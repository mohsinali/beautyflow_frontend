'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Layers3,
  Play,
  Plus,
  Save,
  Scissors,
  Search,
  Tag,
  Trash2,
  UserPlus,
  UserRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { listBranchServices } from '@/features/branch-services/api/branch-services-api';
import { createCustomer, listCustomers } from '@/features/customers/api/customers-api';
import type { Customer } from '@/features/customers/types/customer';
import { listServiceProviders } from '@/features/service-providers/api/service-providers-api';
import type { ServiceProvider } from '@/features/service-providers/types/service-provider';
import { useActiveBranch, useCurrentTenant } from '@/providers/session-provider';
import { usePermissions } from '@/providers/session-provider';
import { permissions } from '@/lib/permissions/permissions';
import { queryKeys } from '@/lib/api/query-client';
import {
  addVisitItem,
  createVisit,
  eligibleProviders,
  getVisit,
  removeVisitItem,
  transitionVisit,
  updateVisit,
  updateVisitItem,
} from '../api/visits-api';
import type { VisitItemInput, VisitItemStatus } from '../types/visit';
import { formatDiscount, formatMoney, parseMoneyInput } from '../lib/money';

interface CartItem extends Omit<VisitItemInput, 'chargedPrice' | 'discountAmount'> {
  key: string;
  id?: string;
  name: string;
  originalPrice: string;
  eligible: ServiceProvider[];
  chargedPrice: string;
  discountAmount: string;
  status?: VisitItemStatus;
  originalProviderId?: string | null;
  originalChargedPrice?: string;
  originalDiscountAmount?: string;
}

export function PosScreen({ visitId }: { visitId?: string }) {
  const t = useTranslations('visits');
  const router = useRouter();
  const queryClient = useQueryClient();
  const tenant = useCurrentTenant();
  const { activeBranch } = useActiveBranch();
  const { can } = usePermissions();
  const canAdjustMoney = can(permissions.visitOverridePrice) && can(permissions.visitApplyDiscount);
  const [serviceSearch, setServiceSearch] = useState('');
  const [category, setCategory] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [defaultProviderId, setDefaultProviderId] = useState('');
  const [defaultProviderTouched, setDefaultProviderTouched] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);
  const [customerDialog, setCustomerDialog] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [editingMoney, setEditingMoney] = useState<string | null>(null);
  const initializedVisitId = useRef<string | null>(null);
  const editVisit = useQuery({
    queryKey: ['pos-visit', tenant?.id, visitId],
    queryFn: ({ signal }) => getVisit(visitId!, signal),
    enabled: Boolean(tenant && visitId),
  });
  const operationalBranchId = editVisit.data?.branch.id ?? activeBranch?.id;
  const catalog = useQuery({
    queryKey: ['pos-catalog', tenant?.id, operationalBranchId, serviceSearch],
    queryFn: ({ signal }) =>
      listBranchServices(
        operationalBranchId!,
        {
          search: serviceSearch,
          categoryId: '',
          availability: 'enabled',
          includeInactive: false,
          page: 1,
          pageSize: 100,
        },
        signal,
      ),
    enabled: Boolean(operationalBranchId),
  });
  const customers = useQuery({
    queryKey: ['pos-customers', tenant?.id, customerSearch],
    queryFn: ({ signal }) =>
      listCustomers({ search: customerSearch, status: 'ACTIVE', page: 1, pageSize: 10 }, signal),
    enabled: customerSearch.trim().length >= 2 && !customer,
  });
  const providers = useQuery({
    queryKey: ['pos-providers', tenant?.id, operationalBranchId],
    queryFn: ({ signal }) =>
      listServiceProviders(
        {
          search: '',
          branchId: operationalBranchId!,
          catalogServiceId: '',
          isActive: true,
          page: 1,
          pageSize: 100,
        },
        signal,
      ),
    enabled: Boolean(operationalBranchId),
  });
  const effectiveDefaultProviderId =
    defaultProviderId ||
    (!visitId && !defaultProviderTouched ? (providers.data?.items[0]?.id ?? '') : '');
  useEffect(() => {
    const visit = editVisit.data;
    if (!visit || initializedVisitId.current === visit.id) return;
    initializedVisitId.current = visit.id;
    void Promise.all(
      visit.items
        .filter((item) => item.status !== 'CANCELLED')
        .map(async (item) => ({
          key: item.id,
          id: item.id,
          catalogServiceId: item.catalogServiceId,
          name: item.serviceNameSnapshot,
          originalPrice: item.originalPrice,
          chargedPrice: item.chargedPrice,
          discountAmount: item.discountAmount,
          providerId: item.providerId,
          eligible: await queryClient.fetchQuery({
            queryKey: queryKeys.eligibleProviders(
              tenant!.id,
              visit.branch.id,
              item.catalogServiceId,
            ),
            queryFn: ({ signal }) =>
              eligibleProviders(visit.branch.id, item.catalogServiceId, signal),
          }),
          status: item.status,
          originalProviderId: item.providerId,
          originalChargedPrice: item.chargedPrice,
          originalDiscountAmount: item.discountAmount,
        })),
    )
      .then((loadedItems) => {
        setCustomer({
          ...visit.customer,
          notes: null,
          isActive: true,
          preferredBranch: null,
          createdAt: visit.createdAt,
          updatedAt: visit.createdAt,
        });
        setDefaultProviderId(visit.defaultProvider?.id ?? '');
        setItems(loadedItems);
      })
      .catch(() => toast.error(t('actionFailed')));
  }, [editVisit.data, queryClient, t, tenant]);
  const createCustomerMutation = useMutation({
    mutationFn: () => createCustomer({ name, phone: phone || null }),
    onSuccess: (value) => {
      setCustomer(value);
      setCustomerDialog(false);
      setName('');
      setPhone('');
    },
  });
  const saveMutation = useMutation({
    mutationFn: async (status: 'DRAFT' | 'IN_PROGRESS') => {
      if (!visitId)
        return createVisit(operationalBranchId!, {
          customerId: customer!.id,
          defaultProviderId: effectiveDefaultProviderId || null,
          status,
          items: items.map(({ catalogServiceId, providerId, chargedPrice, discountAmount }) => ({
            catalogServiceId,
            providerId,
            ...(canAdjustMoney ? { chargedPrice, discountAmount } : {}),
          })),
        });
      const current = editVisit.data!;
      await updateVisit(visitId, {
        customerId: customer!.id,
        defaultProviderId: effectiveDefaultProviderId || null,
      });
      const retainedIds = new Set(items.flatMap((item) => (item.id ? [item.id] : [])));
      const removedItems = current.items.filter(
        (item) => item.status !== 'CANCELLED' && !retainedIds.has(item.id),
      );
      for (const item of removedItems) await removeVisitItem(visitId, item.id);
      for (const item of items) {
        if (!item.id) {
          await addVisitItem(visitId, {
            catalogServiceId: item.catalogServiceId,
            providerId: item.providerId,
            ...(canAdjustMoney
              ? { chargedPrice: item.chargedPrice, discountAmount: item.discountAmount }
              : {}),
          });
          continue;
        }
        const changes: {
          providerId?: string | null;
          chargedPrice?: string;
          discountAmount?: string;
        } = {};
        if (item.providerId !== item.originalProviderId) changes.providerId = item.providerId;
        if (canAdjustMoney && item.chargedPrice !== item.originalChargedPrice)
          changes.chargedPrice = item.chargedPrice;
        if (canAdjustMoney && item.discountAmount !== item.originalDiscountAmount)
          changes.discountAmount = item.discountAmount;
        if (Object.keys(changes).length) await updateVisitItem(visitId, item.id, changes);
      }
      if (status === 'IN_PROGRESS' && current.status === 'DRAFT')
        return transitionVisit(visitId, 'start');
      return getVisit(visitId);
    },
    onSuccess: (visit) => {
      toast.success(t(visitId ? 'updated' : 'created'));
      router.push(`/dashboard/visits/${visit.id}`);
    },
    onError: () => toast.error(t('createFailed')),
  });
  const categories = useMemo(
    () => [
      ...new Map((catalog.data?.allItems ?? []).map((s) => [s.category.id, s.category])).values(),
    ],
    [catalog.data],
  );
  const services = (catalog.data?.allItems ?? []).filter(
    (s) => s.effectiveAvailability && (!category || s.category.id === category),
  );
  const subtotal = items.reduce((sum, item) => sum + Number(item.chargedPrice), 0);
  const discount = items.reduce((sum, item) => sum + Number(item.discountAmount), 0);
  const addService = async (service: (typeof services)[number]) => {
    if (!operationalBranchId || !customer || !tenant) return;
    const defaultProviderIdAtAdd = effectiveDefaultProviderId;
    try {
      const eligible = await queryClient.fetchQuery({
        queryKey: queryKeys.eligibleProviders(tenant.id, operationalBranchId, service.id),
        queryFn: ({ signal }) => eligibleProviders(operationalBranchId, service.id, signal),
      });
      const inherited = eligible.some((p) => p.id === defaultProviderIdAtAdd)
        ? defaultProviderIdAtAdd
        : null;
      setItems((value) => [
        ...value,
        {
          key: crypto.randomUUID(),
          catalogServiceId: service.id,
          name: service.name,
          originalPrice: service.effectivePrice,
          chargedPrice: service.effectivePrice,
          discountAmount: '0',
          providerId: inherited,
          eligible,
        },
      ]);
    } catch {
      toast.error(t('actionFailed'));
    }
  };
  if (!activeBranch && !editVisit.data) return <Card className="p-6">{t('selectBranch')}</Card>;
  if (visitId && editVisit.isLoading) return <Card className="p-6">{t('loading')}</Card>;
  return (
    <div className="space-y-5 pb-24 lg:pb-0">
      <div>
        <h1 className="text-3xl font-semibold">{t('pos')}</h1>
        <p className="text-muted-foreground">
          {visitId ? t('editVisit') : t('newVisit')} ·{' '}
          {editVisit.data?.branch.name ?? activeBranch?.name}
        </p>
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(360px,.7fr)]">
        <Card className="space-y-4 p-4 sm:p-6">
          <div className="relative">
            <Search className="absolute start-3 top-3 size-4 text-muted-foreground" />
            <Input
              className="ps-9"
              value={serviceSearch}
              onChange={(e) => setServiceSearch(e.target.value)}
              placeholder={t('searchTreatments')}
              aria-label={t('searchTreatments')}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <Button
              size="sm"
              variant={!category ? 'default' : 'outline'}
              onClick={() => setCategory('')}
            >
              <Layers3 className="size-4" />
              {t('allCategories')}
            </Button>
            {categories.map((c) => (
              <Button
                key={c.id}
                size="sm"
                variant={category === c.id ? 'default' : 'outline'}
                onClick={() => setCategory(c.id)}
              >
                <Tag className="size-4" />
                {c.name}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {services.map((service) => (
              <button
                type="button"
                key={service.id}
                disabled={!customer}
                aria-disabled={!customer}
                onClick={() => void addService(service)}
                className="min-h-24 rounded-xl border bg-card p-4 text-start transition hover:border-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Scissors className="mb-2 size-4" />
                <span className="block font-medium">{service.name}</span>
                <span className="mt-2 block text-sm text-muted-foreground">
                  {formatMoney(service.effectivePrice)} {tenant?.currencyCode}
                </span>
                {service.durationMinutes ? (
                  <span className="text-xs text-muted-foreground">
                    {service.durationMinutes} min
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </Card>
        <Card className="space-y-5 p-4 sm:p-6">
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t('customer')}</Label>
              <Button size="sm" variant="ghost" onClick={() => setCustomerDialog(true)}>
                <Plus className="size-4" />
                {t('addCustomer')}
              </Button>
            </div>
            {customer ? (
              <button
                className="w-full rounded-lg border p-3 text-start"
                onClick={() => setCustomer(null)}
              >
                <UserRound className="mb-1 size-4" />
                <strong>{customer.name}</strong>
                <span className="block text-sm text-muted-foreground">{customer.phone}</span>
              </button>
            ) : (
              <>
                <Input
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder={t('searchCustomer')}
                  aria-label={t('searchCustomer')}
                />
                <div className="max-h-36 overflow-y-auto">
                  {customers.data?.items.map((item) => (
                    <button
                      key={item.id}
                      className="block w-full rounded-md p-2 text-start hover:bg-muted"
                      onClick={() => setCustomer(item)}
                    >
                      <UserRound className="me-2 inline size-4" />
                      {item.name}
                      <span className="ms-2 text-sm text-muted-foreground">{item.phone}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </section>
          <section className="space-y-2">
            <Label htmlFor="default-provider">{t('defaultProvider')}</Label>
            <select
              id="default-provider"
              className="h-10 w-full rounded-md border bg-background px-3"
              value={effectiveDefaultProviderId}
              onChange={(e) => {
                setDefaultProviderTouched(true);
                setDefaultProviderId(e.target.value);
              }}
            >
              <option value="">{t('noDefaultProvider')}</option>
              {providers.data?.items.map((p) => (
                <option value={p.id} key={p.id}>
                  {p.displayName}
                </option>
              ))}
            </select>
          </section>
          <section className="space-y-3">
            <h2 className="font-semibold">
              {t('visitItems')} ({items.length})
            </h2>
            {!items.length ? (
              <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                {t('emptyCart')}
              </p>
            ) : (
              items.map((item) => (
                <div key={item.key} className="space-y-3 rounded-xl border p-3">
                  <div className="flex justify-between gap-2">
                    <strong>{item.name}</strong>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={t('removeItem')}
                      onClick={() => setItems((all) => all.filter((x) => x.key !== item.key))}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <Label>
                    {t('provider')}
                    <select
                      className="mt-1 h-10 w-full rounded-md border bg-background px-2"
                      value={item.providerId ?? ''}
                      onChange={(e) =>
                        setItems((all) =>
                          all.map((x) =>
                            x.key === item.key ? { ...x, providerId: e.target.value || null } : x,
                          ),
                        )
                      }
                    >
                      <option value="">{t('unassigned')}</option>
                      {item.eligible.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.displayName}
                        </option>
                      ))}
                    </select>
                  </Label>
                  {canAdjustMoney ? (
                    <div className="grid grid-cols-2 gap-2">
                      <Label>
                        {t('price')}
                        <Input
                          inputMode="decimal"
                          value={
                            editingMoney === `${item.key}:price`
                              ? item.chargedPrice
                              : formatMoney(item.chargedPrice)
                          }
                          onFocus={() => setEditingMoney(`${item.key}:price`)}
                          onBlur={() => setEditingMoney(null)}
                          onChange={(e) =>
                            setItems((all) =>
                              all.map((x) =>
                                x.key === item.key
                                  ? { ...x, chargedPrice: parseMoneyInput(e.target.value) }
                                  : x,
                              ),
                            )
                          }
                        />
                      </Label>
                      <Label>
                        {t('discount')}
                        <Input
                          inputMode="decimal"
                          value={
                            editingMoney === `${item.key}:discount`
                              ? item.discountAmount
                              : formatMoney(item.discountAmount)
                          }
                          onFocus={() => setEditingMoney(`${item.key}:discount`)}
                          onBlur={() => setEditingMoney(null)}
                          onChange={(e) =>
                            setItems((all) =>
                              all.map((x) =>
                                x.key === item.key
                                  ? { ...x, discountAmount: parseMoneyInput(e.target.value) }
                                  : x,
                              ),
                            )
                          }
                        />
                      </Label>
                    </div>
                  ) : (
                    <div className="flex justify-between text-sm">
                      <span>{t('price')}</span>
                      <span>
                        {formatMoney(item.chargedPrice)} {tenant?.currencyCode}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </section>
          <div className="space-y-2 border-t pt-4">
            <div className="flex justify-between">
              <span>{t('subtotal')}</span>
              <span>
                {formatMoney(subtotal)} {tenant?.currencyCode}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{t('totalDiscount')}</span>
              <span>{formatDiscount(discount)}</span>
            </div>
            <div className="flex justify-between text-xl font-semibold">
              <span>{t('total')}</span>
              <span>
                {formatMoney(Math.max(0, subtotal - discount))} {tenant?.currencyCode}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              disabled={!customer || !items.length || saveMutation.isPending}
              onClick={() =>
                saveMutation.mutate(
                  editVisit.data?.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'DRAFT',
                )
              }
            >
              <Save className="size-4" />
              {saveMutation.isPending ? t('saving') : visitId ? t('saveChanges') : t('saveDraft')}
            </Button>
            {editVisit.data?.status !== 'IN_PROGRESS' && (
              <Button
                disabled={!customer || !items.length || saveMutation.isPending}
                onClick={() => saveMutation.mutate('IN_PROGRESS')}
              >
                <Play className="size-4" />
                {saveMutation.isPending ? t('saving') : t('startVisit')}
              </Button>
            )}
          </div>
        </Card>
      </div>
      <Dialog open={customerDialog} onOpenChange={setCustomerDialog}>
        <DialogContent>
          <DialogTitle className="text-xl font-semibold">{t('addCustomer')}</DialogTitle>
          <DialogDescription>{t('searchCustomer')}</DialogDescription>
          <form
            className="mt-4 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              createCustomerMutation.mutate();
            }}
          >
            <Label>
              {t('customerName')}
              <Input
                className="mt-1"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Label>
            <Label>
              {t('phone')}
              <Input className="mt-1" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Label>
            <Button className="w-full" disabled={!name.trim() || createCustomerMutation.isPending}>
              <UserPlus className="size-4" />
              {t('createCustomer')}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
