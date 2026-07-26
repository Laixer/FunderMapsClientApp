<script setup lang="ts">
/**
 * A boolean as a chip: checkbox square plus label, green when on.
 *
 * Replaces the four-checkbox matrix on the wizard's first step. A row of chips
 * reads as *a set of properties this report has*, which is what those four
 * booleans are; a stack of checkboxes reads as *a form you must work through*,
 * which they are not — most reports switch on one and leave the rest alone.
 */
defineProps<{ label: string; disabled?: boolean }>()

const model = defineModel<boolean | null>({ default: false })
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="model === true"
    :disabled="disabled"
    class="text-md inline-flex items-center gap-2 rounded-full border px-3 py-[7px] font-semibold disabled:opacity-60"
    :class="
      model
        ? 'border-green-border bg-green-wash text-green-deep'
        : 'border-line-strong bg-surface text-muted hover:border-line-hover'
    "
    @click="model = !model"
  >
    <span
      aria-hidden="true"
      class="text-2xs inline-flex h-3.5 w-3.5 items-center justify-center rounded-xs border text-white"
      :class="model ? 'border-green bg-green' : 'border-line-hover bg-surface'"
    >
      {{ model ? '✓' : '' }}
    </span>
    {{ label }}
  </button>
</template>
