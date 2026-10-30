# FunderMapsClientApp

> **Retired on 2026-10-29.** The Studio moved into **FunderMapsStudio** (studio.funderdata.nl), copied as-is into its
> `app/studio/` on 2026-10-27, and went live there on 2026-10-28. studio.fundermaps.com and app.fundermaps.com redirect to it,
> and the app `fundermaps-studio-prod` from this repo is deleted. The open issues moved to FunderMapsStudio (#9–#15).
> This repo is archived and kept for reference.

Internal "invoer app" (data-entry app) used by FunderMaps staff to enter and
review foundation **inquiries** and **recoveries** (and their samples). Not
customer-facing — that's WebFront. Authentication is the session cookie the
FunderMaps API sets (Better Auth), shared by every `*.fundermaps.com` app; the
login form lives in the auth app.

**Stack:** Vue 3 (`<script setup>`), TypeScript, Vite, Pinia, vue-router,
vue-i18n, Tailwind CSS 4. Package manager: **pnpm**; Node `>=22`.

## Setup

```sh
pnpm install
```

### Develop (Vite dev server)

```sh
pnpm dev
```

### Type-check + production build

```sh
pnpm build
```

### Preview / lint / format

```sh
pnpm preview
pnpm lint
pnpm format
```

## Configuration

Set `VITE_FUNDERMAPS_URL` to the API base URL (see `.env.example`).
