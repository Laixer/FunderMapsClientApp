<script setup lang="ts">
import { computed } from 'vue'

const { link, outline, muted, danger } = defineProps({
  label: { type: String, default: 'Button' },
  type: { type: String, default: 'button' },
  disabled: { type: Boolean, default: false },
  link: { type: Boolean, default: false },
  outline: { type: Boolean, default: false },
  muted: { type: Boolean, default: false },
  danger: { type: Boolean, default: false },
})

const btnClass = computed<string[]>(() => {
  if (link) return ['button-link']
  if (danger)
    return ['button--solid', '!bg-red-500', 'hover:!bg-red-800', 'disabled:!bg-grey-400', 'group']
  if (outline) return ['button--outline', 'group']
  if (muted) return ['button--solid', '!bg-grey-700', 'hover:!bg-grey-800', 'group']
  return ['button--solid', 'group']
})
</script>

<template>
  <button :type="(type as any)" class="button" :class="btnClass" :disabled="disabled">
    <slot name="before" />
    <span class="button__label">{{ label }}</span>
    <slot name="after" />
  </button>
</template>
