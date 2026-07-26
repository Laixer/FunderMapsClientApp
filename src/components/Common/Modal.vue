<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'

import { acquireModalLock } from '@/services/shortcuts'

const props = withDefaults(
  defineProps<{
    title?: string
    closeable?: boolean
    /** Wider sheet, for a document preview. */
    wide?: boolean
  }>(),
  { title: '', closeable: true, wide: false },
)

const emit = defineEmits(['close'])

const handleKey = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.closeable) emit('close')
}

// While a modal is up, the app's keyboard shortcuts stand down — otherwise `j`
// would scroll the table behind the dialog.
let releaseModalLock: (() => void) | null = null

onMounted(() => {
  window.addEventListener('keydown', handleKey)
  releaseModalLock = acquireModalLock()
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKey)
  releaseModalLock?.()
})

function handleBackdrop() {
  if (props.closeable) emit('close')
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/35 p-6 backdrop-blur-[2px]"
    @click.self="handleBackdrop"
  >
    <div
      class="studio-fade w-full overflow-hidden rounded-3xl border border-line bg-surface shadow-overlay"
      :class="wide ? 'max-w-3xl' : 'max-w-lg'"
      role="dialog"
      aria-modal="true"
      :aria-label="title || undefined"
    >
      <header class="flex items-center gap-3 border-b border-divider px-5 py-3.5">
        <h2 v-if="title" class="text-2xl font-display font-bold text-ink">{{ title }}</h2>
        <slot v-else name="header" />
        <button
          v-if="closeable"
          type="button"
          class="ml-auto shrink-0 px-1 text-[18px] leading-none text-ghost hover:text-strong"
          aria-label="Sluiten"
          @click="emit('close')"
        >
          ×
        </button>
      </header>

      <div class="space-y-4 px-5 py-4">
        <slot />
      </div>

      <footer
        v-if="$slots.footer"
        class="flex items-center justify-end gap-2 border-t border-divider px-5 py-3"
      >
        <slot name="footer" />
      </footer>
    </div>
  </div>
</template>
