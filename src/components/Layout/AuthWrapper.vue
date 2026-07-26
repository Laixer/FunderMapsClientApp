<script setup lang="ts">
/**
 * The chrome for the pages that exist outside the studio: the OIDC hand-off and
 * the 404.
 *
 * Deliberately plain — no sidebar, no top bar, no photograph. These are pages
 * you are passing through, and the previous version's full-bleed background
 * image made a two-second redirect look like a destination.
 */
defineProps<{ title?: string }>()
</script>

<template>
  <div class="grid min-h-screen place-content-center gap-6 bg-canvas px-6">
    <div class="flex items-center justify-center gap-2.5">
      <span
        aria-hidden="true"
        class="flex h-[22px] w-[22px] items-center justify-center rounded-md bg-green"
      >
        <span class="h-2 w-2 rounded-full bg-white" />
      </span>
      <span class="font-display text-[16px] font-bold tracking-[-0.2px] text-ink">FunderMaps</span>
      <span
        class="rounded-xs border border-line px-1 py-0.5 font-mono text-[9px] tracking-[0.06em] text-faint"
      >
        STUDIO
      </span>
    </div>

    <h1 v-if="title" class="sr-only">{{ title }}</h1>

    <slot />
  </div>
</template>
