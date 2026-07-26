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

The substitute that works is a **throwaway SSR harness**, deleted before committing: an
entry that re-exports the components/modules under test, built with
`npx vite build --ssr .ssrcheck/entry.ts --outDir .ssrcheck/out --emptyOutDir=false`, and a
`.mjs` runner that asserts on the rendered HTML string. Traps: the output dir must live
inside the project or node cannot resolve `vue`; `onBeforeMount` never runs under SSR (so
adopt route state during *setup* if you want it observable — which `InquiryListView` does
for a second reason: a shared link should render its filters on the first pass); the memory
router needs every named route any rendered `RouterLink` references. Pure logic
(`services/explorer.ts`, `sampleValidation.ts`, the `utils/`) is far cheaper to cover this
way than components — which is much of why it lives in `services/` at all.

## Environment

One required `VITE_` var (see `.env.example`):

- `VITE_FUNDERMAPS_URL` — base URL of the FunderMaps TS API.

## Architecture

### Source Layout (`src/`)

- **`router/`** — `index.ts`: `createWebHistory`, one `beforeEach` guard, route table.
  Everything past the Werkbank is lazily imported (route-level code splitting).
- **`stores/`** — Pinia stores (setup-style): `session` (auth + role flags), `address`
  (geocoder cache), `studio` (sidebar counts + command-palette state).
- **`services/fundermaps/`** — the API layer (see below).
- **`services/`** — the app's logic, deliberately kept out of components so it can be
  tested and reused: `explorer.ts` (the explorer's query object ⇄ URL ⇄ list options, saved
  views, filter chips), `pipeline.ts` (dossier lifecycle), `sampleFields.ts` (the sample
  field registry), `sampleValidation.ts` (cross-field findings), `sampleProvenance.ts`,
  `worklist.ts` (Werkbank lanes), `navigation.ts` + `shortcuts.ts` + `useActionShortcuts.ts`
  (the keyboard layer), `palette.ts`, `tone.ts` (the five semantic colours), `toast.ts`,
  `recents.ts`, `wizard.ts`, and the `*Enums.ts` int↔label tables.
- **`views/`** — route components: `auth/` (Login, Callback, Logout, NotFound),
  `HomeView` (Werkbank), `InquiryListView` (the explorer), `RecoveryListView`, and the
  `inquiry/` & `recovery/` wizards (`Step1`–`Step3`, `View`).
- **`components/`** — `Layout/` (AppShell, Sidebar, TopBar, CommandPalette, WizardHeader,
  AuthWrapper), `Common/` (the design-system primitives: Panel, Field, Button, Pill,
  StatusBadge, Callout, DataTable, KpiTile, Sparkline, PhaseCards, StepPills, Timeline,
  ProgressBar, KeyValueList, FilterChip, FilterBuilder, Dropzone, PresetList, ToggleChip,
  MapPanel, EmptyState, Modal, ConfirmDialog, ToastHost, DocumentCard),
  `Inquiry/` & `Recovery/` (SampleForm, SampleField, SampleOverview, SampleReadonly,
  AddressPicker, BuildingContext, RejectModal), `Mapbox/` (SampleMap), `UserMenu`.
- **`locales/`** — `nl.json` (Dutch is the only locale).
- **`utils/`** — small helpers (date, address, string).
- **`scripts/fetch-fonts.mjs`** — regenerates the self-hosted webfonts + `base/fonts.css`.
  Not part of the build; the woff2 files are committed.

### Path Aliases

- `@` → `src/` (defined in both `vite.config.ts` and `tsconfig.app.json`).
- `@assets` → `src/assets/` (defined in `vite.config.ts`).

### Authentication

**OIDC** authorization-code + PKCE (`client_id=clientapp`). The login form lives in the
auth app (auth.fundermaps.com), not here. The access token is an **opaque bearer** — *not* a
JWT — and there is **no refresh token**: on expiry the app re-obtains a token by bouncing
back through the login redirect.

- `services/oidc.ts` — `loginRedirect()` sends the browser to the provider's `/authorize`;
  `exchangeCode()` (called from `views/auth/Callback.vue` at `/auth/callback`) swaps the code
  for tokens; `logoutRedirect()` does RP-initiated end-session (passing `id_token_hint`).
- `services/fundermaps/session.ts` — stores the access token in `localStorage` under
  `access_token`, plus the `id_token` (kept only for `id_token_hint` on logout).
- `services/fundermaps/client.ts` — `fetch` wrapper (`makeCall`) that injects
  `Authorization: Bearer <token>`, JSON-encodes object bodies, and throws typed errors
  (`errors.ts`). A registered `setUnauthorizedHandler` callback fires on `401`.
- `stores/session.ts` — `authenticateFromAccessToken()` re-verifies the bearer (`user.me()`)
  on a fresh page load; `logout()` clears local state and best-effort signs out server-side.
  Role flags (`isSuperUser`/`isVerifier`/`isWriter`/`isReader`, `canWrite`, `canApprove`)
  derive from the user's **first** organization's role (`currentUser.organizations[0].role`).
- `components/UserMenu.vue` logs out via `logoutRedirect()` (ends the SSO session).
- `App.vue` wires the `401` handler in `onMounted` → `logout()` + bounce to `login`.

### Routing

`router/index.ts` groups routes into **auth** (`/login`, `/logout`, catch-all `NotFound`),
**inquiries** (list at `/inquiries`, a `create`/`edit/1..3` wizard, and `view`), and
**recoveries** (same shape). The root `/` lands on the **Werkbank**, not the archive.

The explorer's entire state — search, status/type/attribution filters, sort and page — lives
in the **query string**, serialised by `services/explorer.ts`. That is what makes a view a
shareable link, and it is why the list routes carry no `:page?` path segment: there is one
place a page number lives, and it is `?page=`.

The `beforeEach` guard restores the session from a stored bearer on first load, then redirects
unauthenticated users to `login`. Routes opt out of the auth check with `meta.public: true`
(login, callback and 404). Layouts are **not** chosen via route meta — each view wraps itself
in `AuthWrapper` (auth/error pages) or `AppShell` (sidebar + top bar + palette + toasts).
`AppShell` takes a `crumb` and an optional `fill`: `fill` pins the content to the viewport and
hands scrolling to the panes inside it, which is what the explorer and the Invoer editor use.

### API Layer (`services/fundermaps/`)

`index.ts` aggregates per-resource endpoint modules from `endpoints/` (`auth`, `user`,
`inquiry`, `inquirySample`, `recovery`, `recoverySample`, `contractor`, `reviewer`,
`geocoder`, `organization`, `pdok`) into a single default-exported `api` object — call as
`api.inquiry.list(...)`, `api.user.me()`, etc. Response shapes live in `interfaces/`
(`IInquiry`, `IRecovery`, `IUser`, …). The API expects the bearer as
`Authorization: Bearer <token>`.

### Styling (Tailwind v4) — the Data Studio design system

The app is a **dense, keyboard-first desktop workspace**. Density over whitespace: 34–38px
rows, 12.5px body text, 32px controls, hairline borders instead of shadows. The shell is
`min-w-shell` (1528px) and scrolls horizontally below that rather than reflowing — there are
no mobile breakpoints, and adding one would mean turning a three-pane editor into a
three-screen scroll.

- Tokens live in `src/style.css` under `@theme`. `@tailwindcss/vite` is the only Tailwind
  integration — there is **no** `tailwind.config.js` or `postcss.config.js`.
- **Colour names are semantic**: `canvas` / `surface` / `raised` / `sunken`, `line` /
  `line-strong` / `divider`, `ink` / `body` / `strong` / `muted` / `subtle` / `faint` /
  `label`, and one saturated family per meaning — `green` (ours, primary, settled), `blue`
  (under review, selection), `amber` (draft, unconfirmed, warning), `red` (danger, error).
  Reach for `services/tone.ts` rather than hard-coding those classes: it maps a `Tone` to the
  pill / dot / fill / callout / sparkline variants, so one status reads identically everywhere.
- **Careful**: Tailwind derives `text-*` from both `--text-*` (size) and `--color-*` (colour),
  so the two scales must never share a word. That is why the line colours are `line` /
  `line-strong` rather than `border` / `border-strong`.
- Type: **Outfit** for headings and big numerals, **Manrope** for UI text, **JetBrains Mono**
  for IDs, dates, measurements and shortcut keys. All three are self-hosted and variable —
  regenerate with `node scripts/fetch-fonts.mjs`.
- Motion is limited to a 140ms fade on overlays (`.studio-fade`). Hover and focus are instant
  colour changes; an eased hover on every table row is a delay you feel without ever seeing.
- The hand-written CSS tree is deliberately thin: `src/styles/app.css` holds only the two
  section captions (`.studio-caption`, `.studio-label`), the native-control reset
  (`.studio-control`) and the MapLibre chrome. It starts with `@reference "../style.css";` so
  `@apply` resolves, and is imported **separately** in `main.ts` — never `@import`ed into the
  Tailwind entry. Mirror this pattern (it matches WebFront) when adding CSS.
- Build screens from `components/Common/` rather than from raw utilities: `Panel` is the only
  card, `Field` the only labelled control, `Button` the only button, `Pill`/`StatusBadge` the
  only status, `DataTable` the only table.

### Honesty rules the UI is held to

These are load-bearing, not stylistic. Several were the point of the redesign:

- **Never render a number the data cannot support.** `update_date` was bulk-stamped by two
  migrations and is wrong for ~4 rows in 5 (see `services/pipeline.ts`), so there is no
  "laatst gewijzigd", no throughput chart and no average lead-time anywhere. The Werkbank's
  tiles are real lane counts; `Sparkline` renders nothing at all for an all-zero series.
- **A capped count says so.** Lane queries stop at `LANE_FETCH`, so the label is `50+`.
- **A filter that only narrows the visible page must say so** — the explorer's type filter
  does, in the filter popover, because `GET /inquiry` has no type parameter.
- **Errors lead with what failed.** `describeFailure(err, 'Opslaan is niet gelukt.')` puts our
  sentence first and the server's words in parentheses; a bare `"not found"` toast is not a
  message to a person.
- **Validation findings are prose and never block.** `services/sampleValidation.ts` explains
  which two fields disagree and names both values; the Netherlands has genuinely strange
  buildings in it, and a tool that refuses to record what the report says is worked around.

### i18n

`i18n.ts` uses vue-i18n in Composition mode (`legacy: false`), locale and fallback both `nl`,
messages from `locales/nl.json`. Use `const { t } = useI18n()` and `t('key.path')`.
