<script setup lang="ts" generic="K extends string | boolean">
/**
 * One choice out of a few, side by side (2026-10-22, the style pass): the
 * Studio's one segmented control — Tabel / Kaart / Gesplitst, Kaart /
 * Luchtfoto, the filters over a list. Each place had drawn its own: black,
 * green-washed, white with a shadow. This is the white one, as the
 * Rapportages switch had it first. An optional count rides beside a label.
 */
defineProps<{
  options: { key: K; label: string; count?: number | null }[]
  modelValue: K
  /** What is being chosen, for a screen reader: "Weergave", "Achtergrond van de kaart". */
  label: string
}>()
defineEmits<{ 'update:modelValue': [key: K] }>()
</script>

<template>
  <div class="flex shrink-0 rounded-lg border border-line bg-canvas p-0.5" role="group" :aria-label="label">
    <button
      v-for="o in options"
      :key="String(o.key)"
      type="button"
      class="text-sm rounded-md px-2.5 py-1 font-semibold whitespace-nowrap"
      :class="modelValue === o.key ? 'bg-surface text-strong shadow-segment' : 'text-subtle hover:text-strong'"
      :aria-pressed="modelValue === o.key"
      @click="$emit('update:modelValue', o.key)"
    >
      {{ o.label }}<span v-if="o.count != null" class="ml-1 font-mono font-normal text-faint">{{ o.count }}</span>
    </button>
  </div>
</template>
