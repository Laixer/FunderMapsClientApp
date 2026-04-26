# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FunderMaps client application — a Vue 2 + TypeScript SPA for managing foundation investigation reports (inquiries). Uses Vue CLI 4, Vuex for state management, and Vue Router with history mode.

## Commands

All commands require `NODE_OPTIONS=--openssl-legacy-provider` due to the older Node.js/Webpack toolchain.

- **Dev server:** `NODE_OPTIONS=--openssl-legacy-provider npm run serve`
- **Build (staging):** `NODE_OPTIONS=--openssl-legacy-provider npm run build`
- **Build (production):** `NODE_OPTIONS=--openssl-legacy-provider npm run build-prod`
- **Lint:** `NODE_OPTIONS=--openssl-legacy-provider npm run lint`

No test runner is currently configured in package.json scripts.

## Architecture

### Webpack Aliases (vue.config.js)

These aliases are used throughout the codebase instead of `@/` paths:

| Alias | Path |
|-------|------|
| `config` | `src/config` |
| `atom` | `src/components/atoms` |
| `molecule` | `src/components/molecules` |
| `organism` | `src/components/organisms` |
| `model` | `src/models` |
| `service` | `src/services` |
| `api` | `src/api` |
| `utils` | `src/utils` |
| `helper` | `src/helpers` |
| `mixin` | `src/mixins` |

The `@/` alias (mapped to `src/`) is also available via tsconfig.

### Component Structure (Atomic Design)

- `src/components/atoms/` — small UI primitives (Divider, TypeTag, ProgressLine, Feedback, branding, navigation, review, dataitems)
- `src/components/molecules/` — composed components (DataRow, forms, headerbars, NavigationBar, SideMenu, UploadArea)
- `src/components/organisms/` — full sections (ReportTable, SampleCard, SideBar, HeaderBar, FormSteps)

### State Management (Vuex)

Modular store at `src/store/` with namespaced modules: `address`, `org`, `reports`, `report`, `user`, `orgUsers`, `samples`, `attestation`, `contractors`, `reviewers`. Each module has a `reset` mutation called by the root `clearAll` action.

### API Layer

- `src/utils/axios.js` — configured Axios instance with base URL from `VUE_APP_API_BASE_URL` env var, auto-attaches auth headers via interceptor
- `src/api/` — API endpoint modules (auth, address, attestation, contractors, org, orgUser, reports, reviewers, samples, upload, user)
- `src/services/` — business logic wrapping API calls (auth service handles JWT login/refresh/logout)

### Routing & Auth

Routes defined in `src/router/index.ts`. Navigation guard redirects unauthenticated users to login. Routes with `meta.public: true` bypass auth. The app auto-refreshes JWT tokens every 10 minutes.

### Key Patterns

- **Mixed JS/TS codebase:** Components use both `.js` and `.ts`. Vue components use `vue-class-component` and `vue-property-decorator` decorators.
- **Report workflow:** Multi-step inquiry creation (Step1 → Step2 → Step3) and a read-only View, all under `/inquiry/` routes.
- **Layouts:** `src/views/layouts/` contains layout wrappers (default, login, empty) selected via route `meta.layout`.
- **SCSS:** Global styles in `src/assets/scss/`, with `common.scss` auto-prepended to all component styles via vue.config.js.
- **Config constants:** `src/config/` holds enums, roles, claim types, and avatar color definitions.
- **Validation:** Uses `vuelidate` for form validation.
