# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FunderMaps **ClientApp** — the internal "invoer app" (Dutch: data-entry app) used by a
small group of FunderMaps staff to enter and review foundation **inquiries** and
**recoveries** (and their samples). It is not customer-facing — that's WebFront.

Stack: **Vue 3** (`<script setup>` SFCs) + **TypeScript** + **Vite** + **Pinia** +
**vue-router** + **vue-i18n** + **Tailwind CSS v4**. Package manager is **pnpm**;
Node `>=22`. (This app shares its design system and Tailwind setup with WebFront —
keep them aligned when touching build tooling.)

## Commands

- **Dev server:** `pnpm dev`
- **Build:** `pnpm build` (runs `type-check` and `vite build` in parallel via `npm-run-all2`)
- **Type-check only:** `pnpm type-check` (`vue-tsc --build`)
- **Preview production build:** `pnpm preview`
- **Lint:** `pnpm lint` (`eslint . --fix`)
- **Format:** `pnpm format` (`prettier --write src/`)

No test runner is configured. (No `NODE_OPTIONS=--openssl-legacy-provider` — that was the
old Vue 2 / Vue CLI toolchain, now gone.)

## Environment

One required `VITE_` var (see `.env.example`):

- `VITE_FUNDERMAPS_URL` — base URL of the FunderMaps TS API.

## Architecture

### Source Layout (`src/`)

- **`router/`** — `index.ts`: `createWebHistory`, a single `beforeEach` guard, route table.
- **`stores/`** — Pinia stores (setup-style): `session` (auth + role flags), `address`.
- **`services/fundermaps/`** — the API layer (see below).
- **`services/`** — also `inquiryEnums.ts` / `recoveryEnums.ts` / `sampleEnums.ts` (int↔label
  helpers mirroring the API's integer enums) and `useValidation.ts` (form-validation composable).
- **`views/`** — route components: `auth/` (Login, Logout, NotFound), `InquiryListView`,
  `RecoveryListView`, and the `inquiry/` & `recovery/` wizards (`Step1`–`Step3`, `View`).
- **`components/`** — `Layout/` (AuthWrapper, MainWrapper, Header), `Common/`
  (Alert, Card, Modal, Spinner, StatusBadge, `Buttons/`, `Inputs/`), `Inquiry/` &
  `Recovery/` (SampleForm, AddressPicker, RejectModal), `Branding/`, `UserMenu`.
- **`locales/`** — `nl.json` (Dutch is the only locale).
- **`utils/`** — small helpers (date, string).

### Path Aliases

- `@` → `src/` (defined in both `vite.config.ts` and `tsconfig.app.json`).
- `@assets` → `src/assets/` (defined in `vite.config.ts`).

### Authentication

Better Auth with an **opaque bearer token** — *not* a JWT. There is **no client-side token
decoding and no refresh token**; the server is the source of truth on whether a session is
alive.

- `services/fundermaps/session.ts` — stores/reads the token in `localStorage` under
  `access_token`.
- `services/fundermaps/client.ts` — `fetch` wrapper (`makeCall`) that injects
  `Authorization: Bearer <token>`, JSON-encodes object bodies, and throws typed errors
  (`errors.ts`). A registered `setUnauthorizedHandler` callback fires on `401`.
- `stores/session.ts` — `login()` calls `auth.login` → stores the token → fetches `user.me()`;
  `authenticateFromAccessToken()` re-verifies the token on a fresh page load;
  `logout()`/`logoutAndRedirect()` clear local state. Role flags
  (`isSuperUser`/`isVerifier`/`isWriter`/`isReader`, `canWrite`, `canApprove`) derive from
  the user's **first** organization's role (`currentUser.organizations[0].role`).
- `App.vue` wires the `401` handler in `onMounted` → logout + bounce to `login`.

### Routing

`router/index.ts` groups routes into **auth** (`/login`, `/logout`, catch-all `NotFound`),
**inquiries** (list at `/inquiries/:page?`, a `create`/`edit/1..3` wizard, and `view`), and
**recoveries** (same shape). The root `/` lands on the inquiry list.

The `beforeEach` guard restores the session from a stored bearer on first load, then redirects
unauthenticated users to `login`. Routes opt out of the auth check with `meta.public: true`
(login and 404). Layouts are **not** chosen via route meta — each view wraps itself in
`AuthWrapper` (auth/error pages) or `MainWrapper` (the app shell with `Header`).

### API Layer (`services/fundermaps/`)

`index.ts` aggregates per-resource endpoint modules from `endpoints/` (`auth`, `user`,
`inquiry`, `inquirySample`, `recovery`, `recoverySample`, `contractor`, `reviewer`,
`geocoder`, `organization`, `pdok`) into a single default-exported `api` object — call as
`api.inquiry.list(...)`, `api.user.me()`, etc. Response shapes live in `interfaces/`
(`IInquiry`, `IRecovery`, `IUser`, …). The API expects the bearer as
`Authorization: Bearer <token>`.

### Styling (Tailwind v4)

- Theme is defined in `src/style.css` via the `@theme` block (the full FunderMaps palette,
  the `legenda` color scale, type scale, and shadows). `@tailwindcss/vite` is the only
  Tailwind integration — there is **no** `tailwind.config.js` or `postcss.config.js`.
- The custom CSS tree lives under `public/resources/styles/` (base / components / utilities /
  pages). Its entry `app.css` starts with `@reference "../../../src/style.css";` so `@apply`
  and `theme()`/`var(--…)` resolve, and it is imported **separately** in `main.ts`
  (`import './style.css'` then `import '../public/resources/styles/app.css'`) — never
  `@import`ed into the Tailwind entry. Mirror this pattern (it matches WebFront) when adding CSS.
- In SFC `<style scoped>` blocks, reference theme values as CSS variables
  (`var(--color-green-500)`), not `theme()` — Tailwind processes scoped blocks in isolation.

### i18n

`i18n.ts` uses vue-i18n in Composition mode (`legacy: false`), locale and fallback both `nl`,
messages from `locales/nl.json`. Use `const { t } = useI18n()` and `t('key.path')`.
