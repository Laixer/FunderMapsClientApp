<script setup lang="ts">
import { computed } from 'vue'

/**
 * Basic button — small radius, flat, framed.
 * Variants are mutually exclusive: link / ghost / outline / muted / danger / (default solid).
 * Sizes: default (compact) or lg (page-level primary actions).
 */

const { link, ghost, outline, muted, danger, lg } = defineProps({
  label: { type: String, default: 'Button' },
  type: { type: String, default: 'button' },
  disabled: { type: Boolean, default: false },
  link: { type: Boolean, default: false },
  ghost: { type: Boolean, default: false },
  outline: { type: Boolean, default: false },
  muted: { type: Boolean, default: false },
  danger: { type: Boolean, default: false },
  lg: { type: Boolean, default: false },
})

const btnClass = computed<string[]>(() => {
  const classes: string[] = []

  if (link) {
    classes.push('button-link')
    return classes
  }

  if (ghost) classes.push('button--ghost', 'group')
  else if (danger)
    classes.push('button--solid', '!bg-red-500', 'hover:!bg-red-800', 'disabled:!bg-grey-400', 'group')
  else if (outline) classes.push('button--outline', 'group')
  else if (muted) classes.push('button--solid', '!bg-grey-700', 'hover:!bg-grey-800', 'group')
  else classes.push('button--solid', 'group')

  if (lg) classes.push('button--lg')

  return classes
})
</script>

<template>
  <button :type="(type as any)" class="button" :class="btnClass" :disabled="disabled">
    <slot name="before" />
    <span class="button__label">{{ label }}</span>
    <slot name="after" />
  </button>
</template>
