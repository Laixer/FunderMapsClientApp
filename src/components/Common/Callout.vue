<script setup lang="ts">
import {
  TONE_CALLOUT,
  TONE_CALLOUT_BODY,
  TONE_CALLOUT_TITLE,
  TONE_DOT,
  type Tone,
} from '@/services/tone'

/**
 * A sentence about the state of things, with an optional way to act on it.
 *
 * This is where the studio explains itself: what is blocking a dossier, which
 * two fields disagree, why a button is disabled. Deliberately prose — "1 van 2
 * adressen mist een funderingstype" tells you what to do; a red ring around a
 * field tells you only that something is wrong.
 */
withDefaults(
  defineProps<{
    title?: string
    tone?: Tone
    /** Hide the leading dot for callouts that are pure explanation. */
    plain?: boolean
  }>(),
  { tone: 'green', plain: false },
)
</script>

<template>
  <div class="flex items-start gap-2.5 rounded-xl border px-3.5 py-3" :class="TONE_CALLOUT[tone]">
    <span
      v-if="!plain"
      aria-hidden="true"
      class="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full"
      :class="TONE_DOT[tone]"
    />
    <div class="min-w-0 flex-1">
      <p v-if="title" class="text-lg font-bold" :class="TONE_CALLOUT_TITLE[tone]">{{ title }}</p>
      <p class="text-md" :class="[TONE_CALLOUT_BODY[tone], title && 'mt-0.5']">
        <slot />
      </p>
    </div>
    <div v-if="$slots.action" class="ml-auto shrink-0 self-center">
      <slot name="action" />
    </div>
  </div>
</template>
