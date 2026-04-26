/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FUNDERMAPS_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
