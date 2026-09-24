'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, LoaderCircle, LogIn } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiRequest } from '@/lib/api/client';
import { ApiError } from '@/lib/api/error';
import { queryKeys } from '@/lib/api/query-client';
import { useQueryClient } from '@tanstack/react-query';

interface TenantChoice {
  name: string;
  slug: string;
}

export function LoginForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(
    params.get('reason') === 'expired' ? t('sessionExpired') : null,
  );
  const [tenantChoices, setTenantChoices] = useState<TenantChoice[]>([]);
  const schema = useMemo(
    () =>
      z.object({
        email: z.string().email(t('emailInvalid')),
        password: z.string().min(1, t('passwordRequired')),
        tenantSlug: z
          .string()
          .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, t('slugInvalid'))
          .or(z.literal('')),
      }),
    [t],
  );
  type LoginValues = z.infer<typeof schema>;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', tenantSlug: '' },
  });

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await apiRequest(
        '/api/auth/login',
        {
          method: 'POST',
          body: {
            email: values.email,
            password: values.password,
            ...(values.tenantSlug ? { tenantSlug: values.tenantSlug } : {}),
          },
        },
        false,
      );
      await queryClient.invalidateQueries({ queryKey: queryKeys.session });
      router.replace('/dashboard');
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError && error.code === 'TENANT_SELECTION_REQUIRED') {
        const details = Array.isArray(error.details) ? error.details : [];
        const safeChoices = details.filter((item): item is TenantChoice =>
          Boolean(
            item &&
            typeof item === 'object' &&
            'name' in item &&
            'slug' in item &&
            typeof item.name === 'string' &&
            typeof item.slug === 'string',
          ),
        );
        setTenantChoices(safeChoices);
        setServerError(t('tenantRequired'));
      } else {
        setServerError(t('invalidCredentials'));
      }
    }
  });

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      {serverError && (
        <div
          className="rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive"
          role="alert"
        >
          {serverError}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">{t('email')}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'email-error' : undefined}
          {...register('email')}
        />
        {errors.email && (
          <p id="email-error" className="text-sm text-destructive" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t('password')}</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            className="pe-12"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'password-error' : undefined}
            {...register('password')}
          />
          <button
            type="button"
            className="focus-ring absolute inset-y-0 end-1 grid w-11 place-items-center rounded-lg text-muted-foreground hover:text-foreground"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? t('hidePassword') : t('showPassword')}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.password && (
          <p id="password-error" className="text-sm text-destructive" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="tenantSlug">{t('tenantSlug')}</Label>
        <Input
          id="tenantSlug"
          autoComplete="organization"
          spellCheck={false}
          aria-invalid={Boolean(errors.tenantSlug)}
          aria-describedby="tenant-hint"
          {...register('tenantSlug')}
        />
        <p id="tenant-hint" className="text-xs leading-5 text-muted-foreground">
          {errors.tenantSlug?.message ?? t('tenantHint')}
        </p>
        {tenantChoices.length > 0 && (
          <div className="flex flex-wrap gap-2" aria-label={t('tenantRequired')}>
            {tenantChoices.map((choice) => (
              <button
                key={choice.slug}
                type="button"
                className="focus-ring rounded-lg border border-border bg-muted px-3 py-2 text-sm hover:border-secondary"
                onClick={() => setValue('tenantSlug', choice.slug, { shouldValidate: true })}
              >
                <span dir="auto">{choice.name}</span>{' '}
                <span className="text-muted-foreground">({choice.slug})</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <LogIn className="size-4" />
        )}
        {isSubmitting ? t('signingIn') : t('signIn')}
      </Button>
    </form>
  );
}
