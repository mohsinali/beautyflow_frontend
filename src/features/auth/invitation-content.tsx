'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { useForm, type UseFormRegisterReturn } from 'react-hook-form';
import { z } from 'zod';
import { Brand } from '@/components/layout/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiRequest } from '@/lib/api/client';
import { ApiError } from '@/lib/api/error';

type State =
  | { kind: 'loading' }
  | { kind: 'invalid' }
  | { kind: 'expired' }
  | { kind: 'used' }
  | { kind: 'ready'; tenantName: string; requiresPassword: boolean }
  | { kind: 'success' };

interface Envelope<T> {
  data: T;
}

export function InvitationContent() {
  const t = useTranslations('invitations');
  const router = useRouter();
  const [token, setToken] = useState('');
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const schema = useMemo(
    () =>
      z
        .object({
          password: z.string().min(10, t('passwordPolicy')).max(200, t('passwordPolicy')),
          confirmPassword: z.string(),
        })
        .refine((value) => value.password === value.confirmPassword, {
          path: ['confirmPassword'],
          message: t('passwordMismatch'),
        }),
    [t],
  );
  type Values = z.infer<typeof schema>;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const rawToken = params.get('token') ?? '';
    window.history.replaceState(null, '', window.location.pathname);
    if (!rawToken) {
      queueMicrotask(() => setState({ kind: 'invalid' }));
      return;
    }
    void apiRequest<Envelope<{ tenantName: string; requiresPassword: boolean }>>(
      '/api/auth/invitations/validate',
      { method: 'POST', body: { token: rawToken } },
      false,
    )
      .then(({ data }) => {
        setToken(rawToken);
        setState({ kind: 'ready', ...data });
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.code === 'INVITATION_EXPIRED')
          setState({ kind: 'expired' });
        else if (error instanceof ApiError && error.code === 'INVITATION_ALREADY_USED')
          setState({ kind: 'used' });
        else setState({ kind: 'invalid' });
      });
  }, []);

  const accept = async (values?: Values) => {
    setServerError(null);
    try {
      await apiRequest(
        '/api/auth/invitations/accept',
        {
          method: 'POST',
          body: {
            token,
            ...(state.kind === 'ready' && state.requiresPassword ? values : {}),
          },
        },
        false,
      );
      setState({ kind: 'success' });
    } catch {
      setServerError(t('acceptFailed'));
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-5">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Brand />
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          {state.kind === 'loading' && (
            <p className="flex items-center gap-2">
              <LoaderCircle className="size-4 animate-spin" />
              {t('validating')}
            </p>
          )}
          {state.kind === 'invalid' && (
            <>
              <h1 className="font-display text-3xl font-semibold">{t('invalid')}</h1>
              <p className="mt-2 text-muted-foreground">{t('invalidDescription')}</p>
            </>
          )}
          {state.kind === 'expired' && (
            <>
              <h1 className="font-display text-3xl font-semibold">{t('expired')}</h1>
              <p className="mt-2 text-muted-foreground">{t('expiredDescription')}</p>
            </>
          )}
          {state.kind === 'used' && (
            <>
              <h1 className="font-display text-3xl font-semibold">{t('used')}</h1>
              <p className="mt-2 text-muted-foreground">{t('usedDescription')}</p>
            </>
          )}
          {state.kind === 'success' && (
            <>
              <h1 className="font-display text-3xl font-semibold">{t('success')}</h1>
              <p className="mt-2 text-muted-foreground">{t('successDescription')}</p>
              <Button className="mt-6 w-full" onClick={() => router.replace('/login')}>
                {t('continueLogin')}
              </Button>
            </>
          )}
          {state.kind === 'ready' && (
            <form
              className="space-y-5"
              onSubmit={
                state.requiresPassword
                  ? handleSubmit(accept)
                  : (event) => {
                      event.preventDefault();
                      void accept();
                    }
              }
              noValidate
            >
              <div>
                <h1 className="font-display text-3xl font-semibold">{t('title')}</h1>
                <p className="mt-2 text-muted-foreground">
                  {t('description', { tenant: state.tenantName })}
                </p>
              </div>
              {state.requiresPassword && (
                <>
                  <PasswordField
                    id="invitation-password"
                    label={t('password')}
                    visible={showPassword}
                    toggle={() => setShowPassword((value) => !value)}
                    error={errors.password?.message}
                    registration={register('password')}
                    showLabel={showPassword ? t('hidePassword') : t('showPassword')}
                  />
                  <div className="space-y-2">
                    <Label htmlFor="invitation-confirm">{t('confirmPassword')}</Label>
                    <Input
                      id="invitation-confirm"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      aria-invalid={Boolean(errors.confirmPassword)}
                      {...register('confirmPassword')}
                    />
                    {errors.confirmPassword && (
                      <p className="text-sm text-destructive" role="alert">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </>
              )}
              {serverError && (
                <p className="text-sm text-destructive" role="alert">
                  {serverError}
                </p>
              )}
              <Button className="w-full" type="submit" disabled={isSubmitting}>
                {isSubmitting && <LoaderCircle className="size-4 animate-spin" />}
                {isSubmitting ? t('accepting') : t('accept')}
              </Button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

function PasswordField({
  id,
  label,
  visible,
  toggle,
  error,
  registration,
  showLabel,
}: {
  id: string;
  label: string;
  visible: boolean;
  toggle: () => void;
  error?: string;
  registration: UseFormRegisterReturn;
  showLabel: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete="new-password"
          className="pe-12"
          aria-invalid={Boolean(error)}
          {...registration}
        />
        <button
          type="button"
          className="focus-ring absolute inset-y-0 end-1 grid w-11 place-items-center rounded-lg text-muted-foreground"
          onClick={toggle}
          aria-label={showLabel}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
