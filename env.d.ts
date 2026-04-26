/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FUNDERMAPS_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

/**
 * @bhplugin/vue3-datatable ships types but its package.json `exports` field
 * doesn't surface them under the resolver vite-tsc uses. Re-declare as
 * a minimal Vue component shim until upstream fixes its exports map.
 */
declare module '@bhplugin/vue3-datatable' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

