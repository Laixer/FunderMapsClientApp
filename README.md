# FunderMapsClientApp

Internal "invoer app" (data-entry app) used by FunderMaps staff to enter and
review foundation **inquiries** and **recoveries** (and their samples). Not
customer-facing — that's WebFront. Authentication is OIDC (authorization-code +
PKCE) against the FunderMaps API; the login form lives in the auth app.

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
