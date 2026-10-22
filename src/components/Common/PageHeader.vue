<script setup lang="ts">
/**
 * The top of a page (2026-10-22): one shape for every page, so you can tell at
 * a glance what kind of page you are on and what it is for. A small caption
 * names the kind (Inzicht, Werk, Pand, …), the title the thing, one line its
 * purpose; on the right the time the figures were counted and the actions.
 */
defineProps<{
  title: string
  /** Small uppercase caption above the title: the kind of page. */
  kicker?: string
  /** One line under the title: what this page is for, or the thing's key facts. */
  purpose?: string
  /** Mono aside on the right, e.g. "geteld om 12:43". */
  meta?: string
}>()
</script>

<template>
  <header class="flex items-end gap-4">
    <div class="min-w-0 flex-1">
      <p v-if="kicker" class="studio-caption mb-1">{{ kicker }}</p>
      <h1 class="text-3xl flex min-w-0 items-center gap-3 font-display font-bold text-ink">
        <span class="truncate">{{ title }}</span>
        <slot name="badges" />
      </h1>
      <p v-if="purpose || $slots.purpose" class="text-md mt-0.5 text-muted">
        <slot name="purpose">{{ purpose }}</slot>
      </p>
    </div>
    <span v-if="meta" class="text-sm shrink-0 pb-1 font-mono text-faint">{{ meta }}</span>
    <div v-if="$slots.actions" class="flex shrink-0 items-center gap-2">
      <slot name="actions" />
    </div>
  </header>
</template>
