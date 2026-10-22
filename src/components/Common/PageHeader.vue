<script setup lang="ts">
/**
 * The top of a page (2026-10-22): one shape for every page, so you can tell at
 * a glance what kind of page you are on and what it is for. A small caption
 * names the kind (Inzicht, Pand, Rapportage, …), the title the thing, one line
 * its purpose; on the right the time the figures were counted and the actions.
 *
 * `compact` is the same header on one line, for the workspaces that fill the
 * window (Controle, Rapportages, Herstel, a dossier): there every pixel of
 * height is a row of the table.
 */
withDefaults(
  defineProps<{
    title: string
    /** Small uppercase caption: the kind of page. */
    kicker?: string
    /** One line: what this page is for, or the thing's key facts. */
    purpose?: string
    /** Mono aside on the right, e.g. "geteld om 12:43". */
    meta?: string
    compact?: boolean
  }>(),
  { compact: false },
)
</script>

<template>
  <header v-if="compact" class="flex min-w-0 items-center gap-3">
    <span v-if="kicker" class="studio-caption shrink-0">{{ kicker }}</span>
    <h1 class="text-xl flex min-w-0 shrink-0 items-center gap-2 font-display font-bold text-ink">
      <span class="truncate">{{ title }}</span>
      <slot name="badges" />
    </h1>
    <p v-if="purpose || $slots.purpose" class="text-md min-w-0 truncate text-muted">
      <slot name="purpose">{{ purpose }}</slot>
    </p>
    <span v-if="meta" class="text-sm ml-auto shrink-0 font-mono text-faint">{{ meta }}</span>
    <div v-if="$slots.actions" class="flex shrink-0 items-center gap-2" :class="{ 'ml-auto': !meta }">
      <slot name="actions" />
    </div>
  </header>
  <header v-else class="flex items-end gap-4">
    <div class="min-w-0 flex-1">
      <p v-if="kicker" class="studio-caption mb-0.5 leading-none">{{ kicker }}</p>
      <!-- Wraps rather than cuts off: a rapportage's name can be a whole address list. -->
      <h1 class="text-3xl flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 font-display font-bold text-ink">
        <span class="min-w-0 break-words">{{ title }}</span>
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
