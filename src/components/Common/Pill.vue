<script setup lang="ts">
import { TONE_DOT, TONE_PILL, type Tone } from '@/services/tone'

/**
 * A state, said in two ways at once: a coloured dot and a word.
 *
 * The dot is not decoration — it is what makes the pill legible when you are
 * scanning a column of forty rows and not reading any of them. The word is
 * what makes it legible to someone who cannot tell the dot's colour apart.
 * Neither is optional, which is why this is a component rather than a class.
 */
withDefaults(
  defineProps<{
    label: string
    tone?: Tone
    /** Drop the dot where the surrounding row already carries the colour. */
    plain?: boolean
  }>(),
  { tone: 'neutral', plain: false },
)
</script>

<template>
  <span
    class="text-sm inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-[3px] font-semibold whitespace-nowrap"
    :class="TONE_PILL[tone]"
  >
    <span
      v-if="!plain"
      aria-hidden="true"
      class="h-[5px] w-[5px] shrink-0 rounded-full"
      :class="TONE_DOT[tone]"
    />
    {{ label }}
  </span>
</template>
