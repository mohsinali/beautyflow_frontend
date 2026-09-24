import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginForm } from './login-form';
import { renderApp } from '@/test/render';

const replace = vi.fn();
const refresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, refresh }),
  useSearchParams: () => new URLSearchParams(),
}));

describe('LoginForm', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    replace.mockReset();
    refresh.mockReset();
  });

  it('renders accessible login controls', () => {
    renderApp(<LoginForm />);
    expect(screen.getByRole('textbox', { name: /email address/i })).toHaveAttribute(
      'autocomplete',
      'email',
    );
    expect(screen.getByLabelText(/^password$/i)).toHaveAttribute(
      'autocomplete',
      'current-password',
    );
    expect(screen.getByRole('button', { name: /sign in/i })).toBeEnabled();
  });

  it('rejects invalid client-side input without a request', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    renderApp(<LoginForm />);
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText(/valid email address/i)).toBeVisible();
    expect(screen.getByText(/enter your password/i)).toBeVisible();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('redirects after a successful login', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ data: { authenticated: true } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    renderApp(<LoginForm />);
    await userEvent.type(screen.getByLabelText(/email address/i), 'owner@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'secret');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/dashboard'));
  });

  it('shows a safe message for invalid credentials', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ code: 'UNAUTHORIZED', message: 'internal detail' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      }),
    );
    renderApp(<LoginForm />);
    await userEvent.type(screen.getByLabelText(/email address/i), 'owner@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText(/email, password or salon is incorrect/i)).toBeVisible();
    expect(screen.queryByText('internal detail')).not.toBeInTheDocument();
  });

  it('renders safe tenant choices when selection is required', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          code: 'TENANT_SELECTION_REQUIRED',
          message: 'Tenant selection is required',
          details: [{ name: 'Glow Salon', slug: 'glow-salon' }],
        }),
        { status: 422, headers: { 'content-type': 'application/json' } },
      ),
    );
    renderApp(<LoginForm />);
    await userEvent.type(screen.getByLabelText(/email address/i), 'owner@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'secret');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByRole('button', { name: /glow salon/i })).toBeVisible();
  });
});
