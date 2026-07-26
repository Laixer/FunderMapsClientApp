<script setup lang="ts">
import { TONE_DOT, type Tone } from '@/services/tone'

export interface Preset {
  key: string
  label: string
  /** What it prefills, in a few words. */
  meta: string
  tone: Tone
  /** Numeric hotkey, 1–3. */
  hotkey: string
}

/**
 * "Snel beginnen" — the three shapes of report people actually create.
 *
 * Almost every new dossier is one of a handful of kinds, and each kind implies
 * a type and a set of flags. Picking the shape first and adjusting after beats
 * walking six fields every time.
 */
defineProps<{ presets: Preset[] }>()

defineEmits<{ pick: [preset: Preset] }>()
</script>

<template>
  <ul class="flex flex-col gap-2">
    <li v-for="preset in presets" :key="preset.key">
      <button
        type="button"
        class="flex w-full items-center gap-2.5 rounded-xl border border-line px-2.5 py-2 text-left hover:border-line-hover hover:bg-raised"
        @click="$emit('pick', preset)"
      >
        <span aria-hidden="true" class="h-1.5 w-1.5 rounded-full" :class="TONE_DOT[preset.tone]" />
        <span class="min-w-0 flex-1">
          <span class="text-md block truncate font-semibold text-body">{{ preset.label }}</span>
          <span class="text-sm block truncate text-faint">{{ preset.meta }}</span>
        </span>
        <kbd class="text-xs shrink-0 font-mono text-label">{{ preset.hotkey }}</kbd>
      </button>
    </li>
  </ul>
</template>
