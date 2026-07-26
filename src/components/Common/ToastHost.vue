<script setup lang="ts">
import { dismiss, toasts } from '@/services/toast'
import { TONE_CALLOUT, TONE_CALLOUT_TITLE, TONE_DOT } from '@/services/tone'

/**
 * Where toasts land: bottom-right, stacked, newest last.
 *
 * Bottom-right rather than top-centre because the top of every screen in this
 * app is already a sticky header carrying the actions that raise these
 * messages — a toast there would cover the button you just pressed.
 */
</script>

<template>
  <div
    class="pointer-events-none fixed right-6 bottom-6 z-50 flex w-[360px] flex-col gap-2"
    role="status"
    aria-live="polite"
  >
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="studio-fade pointer-events-auto flex items-start gap-2.5 rounded-xl border px-3.5 py-3 shadow-overlay"
      :class="TONE_CALLOUT[toast.tone]"
    >
      <span
        aria-hidden="true"
        class="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full"
        :class="TONE_DOT[toast.tone]"
      />
      <p class="text-md min-w-0 flex-1" :class="TONE_CALLOUT_TITLE[toast.tone]">
        {{ toast.message }}
      </p>
      <button
        type="button"
        class="shrink-0 px-1 leading-none text-ghost hover:text-strong"
        aria-label="Melding sluiten"
        @click="dismiss(toast.id)"
      >
        ×
      </button>
    </div>
  </div>
</template>
