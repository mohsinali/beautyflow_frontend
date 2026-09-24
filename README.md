# BeautyFlow frontend

Stage 1 is a Next.js App Router foundation for BeautyFlow’s tenant and platform workspaces. It contains authentication, session restoration, tenant language and direction, active-branch context, role-aware navigation, theming, reusable feedback primitives, and a production-oriented same-origin backend-for-frontend (BFF). Stage 2 business screens are intentionally deferred.

## Stack and structure

- Next.js App Router, React, strict TypeScript, Tailwind CSS 4, and shadcn-style Radix primitives
- TanStack Query for server state; focused React contexts for session and active branch
- React Hook Form and Zod for localized form validation
- `next-intl` for runtime EN/AR messages and `next-themes` for light/dark/system themes
- Vitest + React Testing Library and mocked-boundary Playwright browser tests

```text
src/
├── app/                 routes, error states, and same-origin BFF handlers
├── components/          UI primitives, shell, navigation, feedback, dashboard
├── features/auth/       login presentation and behavior
├── lib/                 API, server auth, permissions, logging, utilities
├── messages/            complete English and Arabic resources
├── providers/           query, session/branch, theme and i18n composition
├── test/                test setup and render helpers
└── types/               stable frontend session model
```

## Setup

Requires Node 20.19+ and the BeautyFlow backend.

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3001`. The backend defaults to `http://localhost:3000/api/v1`.

| Variable                       | Purpose                                                     |
| ------------------------------ | ----------------------------------------------------------- |
| `NEXT_PUBLIC_APP_NAME`         | Public display name                                         |
| `BACKEND_API_URL`              | Server-only backend base URL; never exposed to browser code |
| `NEXT_PUBLIC_DEFAULT_LANGUAGE` | Safe pre-tenant locale (`en`)                               |
| `AUTH_COOKIE_SECURE`           | Use `1` behind local HTTPS; production is always secure     |

Production must use HTTPS. Deploy the frontend and backend on trusted infrastructure, keep `BACKEND_API_URL` private, use secure cookies, and ensure reverse-proxy host/protocol forwarding is correct. The BFF validates same-origin mutation markers/origins and proxies only an explicit path allowlist, not arbitrary URLs.

## Commands

```bash
npm run dev
npm run format:check
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
npm start
```

Playwright tests are mocked frontend E2E checks, clearly separate from real backend integration. They cover login, route protection/session restoration, branch selection, logout, LTR/RTL, mobile navigation, and theme switching.

## Authentication and session architecture

The backend returns raw bearer and refresh tokens. Browser code posts credentials to `/api/auth/login`; Next.js forwards them to the actual backend, removes both tokens from the response, and stores them in `HttpOnly`, `SameSite=Lax`, production-`Secure` cookies. Neither token is placed in local/session storage or a URL. Browser API code communicates only with same-origin route handlers.

`/api/auth/session` calls backend `/auth/me`, refreshes an expired access token once, rotates both cookies, and retries once. Browser requests also share one refresh promise so simultaneous 401s produce one refresh call. A failed refresh clears both cookies. Logout and logout-all call the backend and clear cookies/cache even if the upstream session is unusable.

The Next.js `proxy.ts` redirects requests based on cookie presence to prevent protected-page rendering before client session resolution. The authenticated shell then remains in a full-page loading state until `/auth/me` is validated. Backend authorization remains final; frontend permissions only improve UX.

## Tenant language, RTL, and tenant data

`src/messages/en.json` and `src/messages/ar.json` contain all Stage 1 UI copy. The resolved tenant language updates `<html lang>` and `<html dir>` at runtime (`EN → en/ltr`, `AR → ar/rtl`) without persisting a user preference. Layout uses logical start/end positioning, RTL directional icon transforms, and direction-aware desktop/mobile navigation. Dates are locale/timezone-aware. Tenant-created branch and salon names render verbatim with `dir="auto"` where useful.

The current backend has a blocking contract limitation: `/auth/me` returns user, platform role, `{id, slug, role}` tenant data, and branches, but omits tenant name/language/currency/timezone, membership ID, and resolved permissions. `/tenant/settings` supplies tenant settings only to `SALON_OWNER`; receptionists and providers receive 403. Therefore owners receive authoritative EN/AR settings through a second BFF request, while non-owner tenant sessions safely default to English, `PKR`, and their branch timezone. This is visible as a non-alarming dashboard notice. The backend should add non-sensitive tenant presentation context and resolved permissions to `/auth/me` to fully satisfy runtime language for all roles. No backend code was changed.

## Active branch

Branches come only from `/auth/me`. A single branch is selected automatically; multiple branches restore a previous choice only after validating it against the current accessible list. Storage contains only a branch ID and is scoped by tenant + user. Invalid IDs are discarded. Changing branch invalidates branch-scoped TanStack Query keys. `apiRequest` adds `X-Branch-Id` only when explicitly given `branchId`; branch query keys include both tenant and branch IDs.

## Roles, navigation, and permissions

Navigation policy is centralized in `navigation-config.ts`; permissions are exposed through `usePermissions` and `<Can>`. Because the backend does not return resolved permissions, the adapter mirrors the inspected backend permission tables as a temporary UI-only fallback.

| Role             | Stage 1 navigation                                              |
| ---------------- | --------------------------------------------------------------- |
| Super Admin      | Platform Dashboard, Tenants (coming soon)                       |
| Salon Owner      | Dashboard plus management/operations entries marked coming soon |
| Receptionist     | Dashboard and limited operational entries                       |
| Service Provider | Dashboard, Catalog, Service Providers (future entries)          |

## Visual system and accessibility

Semantic CSS tokens implement the approved warm-ivory, deep-plum, berry, dusty-rose, and pale-blush light palette plus a coordinated intentional dark palette. Status colors remain semantic. The dashboard greeting uses the optimized local decorative `public/botanical-lines.svg`, masked with theme tokens and mirrored in RTL; it is hidden from assistive technology. The shell includes landmarks, a skip link, visible focus, keyboard-accessible Radix menus/dialogs, accessible labels and errors, reduced-motion handling, and touch-sized controls.

Routes: `/`, `/login`, `/dashboard`, `/unauthorized`, plus localized not-found and app error states. Catalog, providers, customers, visits/POS, payments, appointments, reports, inventory, branches/staff management, and tenant/platform settings screens are deferred; no fabricated production business data or empty routes were added.
