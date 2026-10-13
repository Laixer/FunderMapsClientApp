<script setup lang="ts">
import { useId } from 'vue'

/**
 * A boolean as a chip: checkbox square plus label, green when on.
 *
 * Replaces the four-checkbox matrix on the wizard's first step. A row of chips
 * reads as *a set of properties this report has*, which is what those four
 * booleans are; a stack of checkboxes reads as *a form you must work through*,
 * which they are not — most reports switch on one and leave the rest alone.
 *
 * `tristate` is for a yes/no question that may stay unanswered, which is every
 * observation in the sample form: the chip then carries a "Ja" and a "Nee", and
 * pressing the one that is on takes the answer back (null). As an on/off chip
 * the field could only be flipped after the first click, so one wrong click
 * turned "not looked at" into a claim, and "nee" looked the same as "empty".
 */
defineProps<{ label: string; disabled?: boolean; tristate?: boolean }>()

const model = defineModel<boolean | null>({ default: false })

const labelId = useId()

/**
 * Whole class strings: Tailwind scans source text. "Ja" is the green of the
 * on/off chip; "Nee" is an answer too, so it is as firmly marked, in grey.
 */
const CHOICES = [
  { value: true, label: 'Ja', on: 'border-green bg-green-tint text-green-deep' },
  { value: false, label: 'Nee', on: 'border-muted bg-line text-ink' },
] as const
</script>

<template>
  <div
    v-if="tristate"
    role="group"
    :aria-labelledby="labelId"
    class="text-md inline-flex items-center gap-1 rounded-full border border-line-strong bg-surface py-[3px] pr-[3px] pl-3 font-semibold"
    :class="disabled && 'opacity-60'"
  >
    <span :id="labelId" class="mr-1 text-strong">{{ label }}</span>
    <button
      v-for="choice in CHOICES"
      :key="choice.label"
      type="button"
      :aria-pressed="model === choice.value"
      :disabled="disabled"
      class="text-base rounded-full border px-2.5 py-[3px] font-semibold"
      :class="
        model === choice.value
          ? choice.on
          : 'border-line-strong bg-surface text-strong hover:border-line-hover'
      "
      @click="model = model === choice.value ? null : choice.value"
    >
      {{ choice.label }}
    </button>
  </div>

  <button
    v-else
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
