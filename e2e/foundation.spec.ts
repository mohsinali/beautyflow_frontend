import { expect, test, type BrowserContext, type Page } from '@playwright/test';

const ownerSession = {
  user: { id: 'user-1', email: 'owner@example.com', firstName: 'Mishal', lastName: 'Khan' },
  platformRole: null,
  tenant: {
    id: 'tenant-1',
    name: 'Glow Salon',
    slug: 'glow-salon',
    role: 'SALON_OWNER',
    membershipId: null,
    language: 'EN',
    currencyCode: 'PKR',
    timezone: 'Asia/Karachi',
    settingsResolved: true,
  },
  permissions: ['branch.view'],
  accessibleBranches: [
    { id: 'main', name: 'Main Branch', code: 'MAIN', timezone: 'Asia/Karachi' },
    { id: 'north', name: 'North Branch', code: 'NORTH', timezone: 'Asia/Karachi' },
  ],
};

async function authenticated(context: BrowserContext, page: Page, session = ownerSession) {
  await context.addCookies([
    {
      name: 'bf_access',
      value: 'opaque-test-cookie',
      url: 'http://127.0.0.1:3001',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
  await page.route('**/api/auth/session', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: session }),
    }),
  );
}

test('protected routes redirect to login', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login$/);
});

test('login restores a session and opens the dashboard', async ({ context, page }, testInfo) => {
  await page.route('**/api/auth/session', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: ownerSession }),
    }),
  );
  await page.route('**/api/auth/login', async (route) => {
    await context.addCookies([
      {
        name: 'bf_access',
        value: 'opaque-test-cookie',
        url: 'http://127.0.0.1:3001',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { authenticated: true } }),
    });
  });
  await page.goto('/login');
  await page.screenshot({ path: testInfo.outputPath('login.png'), fullPage: true });
  await page.getByLabel('Email address').fill('owner@example.com');
  await page.getByLabel('Password', { exact: true }).fill('ChangeMe123!');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name: /Mishal/ })).toBeVisible();
});

test('session restoration, branch selection, theme and logout', async ({
  context,
  page,
}, testInfo) => {
  await authenticated(context, page);
  await page.route('**/api/auth/logout', (route) =>
    route.fulfill({
      status: 200,
      headers: { 'set-cookie': 'bf_access=; Max-Age=0; Path=/' },
      contentType: 'application/json',
      body: JSON.stringify({ data: { loggedOut: true } }),
    }),
  );
  await page.goto('/dashboard');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await page.getByRole('combobox').selectOption('north');
  await expect(page.getByRole('combobox')).toHaveValue('north');
  await expect(page.locator('p[dir="auto"]').filter({ hasText: 'North Branch' })).toBeVisible();
  await page.getByRole('button', { name: 'Theme' }).click();
  await page.getByRole('menuitem', { name: 'Dark' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.screenshot({ path: testInfo.outputPath('dark-dashboard.png'), fullPage: true });
  await page.getByRole('button', { name: 'Account menu' }).click();
  await page.getByRole('menuitem', { name: 'Log out', exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
});

test('Arabic session mirrors the shell and keeps tenant data unchanged', async ({
  context,
  page,
}, testInfo) => {
  const arabic = { ...ownerSession, tenant: { ...ownerSession.tenant, language: 'AR' } };
  await authenticated(context, page, arabic);
  await page.goto('/dashboard');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByText('Glow Salon').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'المظهر' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('arabic-dashboard.png'), fullPage: true });
});

test('mobile navigation is keyboard and touch accessible', async ({ context, page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Mobile-only shell verification');
  await authenticated(context, page);
  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
  await expect(page.locator('body')).not.toHaveCSS('overflow-x', 'scroll');
  await page.screenshot({ path: testInfo.outputPath('mobile-drawer.png'), fullPage: true });
});
