/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FUNDERMAPS_URL: string
  // Optional — when both are set, Step 2's sample map column renders.
  // Without them the wizard still works; the map column is hidden.
  readonly VITE_MAPBOX_TOKEN?: string
  readonly VITE_MAPBOX_STYLE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
