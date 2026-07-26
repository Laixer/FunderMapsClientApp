<script setup lang="ts">
/**
 * The studio's one card.
 *
 * White surface, hairline border, 12px radius, no shadow — a page here can hold
 * eight of these side by side, and eight drop shadows would turn it to mush.
 * Depth comes from the border and from the canvas showing through the gaps.
 *
 * Two header shapes, because the design uses two: a `caption` (small uppercase,
 * for a card that is a *group of fields*) and a `title` (bold 13px, for a card
 * that is a *thing with contents*, like the queue table). `flush` drops the body
 * padding and rules off the header — that is the table variant, where the rows
 * supply their own padding and must run edge to edge.
 */
withDefaults(
  defineProps<{
    /** Small uppercase caption, e.g. `RAPPORT`. */
    caption?: string
    /** Bold card title, e.g. `Te controleren door jou`. */
    title?: string
    /** Mono aside next to the caption/title — a count, a hint, a completeness. */
    meta?: string
    /** Body runs edge-to-edge and the header gets a rule. For tables and lists. */
    flush?: boolean
  }>(),
  { flush: false },
)
</script>

<template>
  <section
    class="rounded-2xl border border-line bg-surface"
    :class="flush ? 'overflow-hidden' : 'px-[18px] py-4'"
  >
    <header
      v-if="caption || title || $slots.actions || $slots.header"
      class="flex items-center gap-2.5"
      :class="flush ? 'border-b border-divider px-4 py-3' : 'mb-3.5'"
    >
      <slot name="header">
        <span v-if="title" class="text-lg font-bold text-strong">{{ title }}</span>
        <span v-else-if="caption" class="studio-caption">{{ caption }}</span>
        <span v-if="meta" class="text-xs font-mono text-label">{{ meta }}</span>
      </slot>
      <div v-if="$slots.actions" class="ml-auto flex items-center gap-1.5">
        <slot name="actions" />
      </div>
    </header>

    <slot />
  </section>
</template>
