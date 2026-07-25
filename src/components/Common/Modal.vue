<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'

import CloseBtn from '@/components/Common/Buttons/CloseBtn.vue'
import { acquireModalLock } from '@/services/shortcuts'

const props = withDefaults(
  defineProps<{
    title?: string
    closeable?: boolean
  }>(),
  {
    title: '',
    closeable: true,
  },
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
    class="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/30 p-4"
    @click.self="handleBackdrop"
  >
    <div
      class="border-grey-200 relative w-full max-w-xl rounded-md border bg-white shadow-lg"
      role="dialog"
      aria-describedby="dialog-label"
      aria-modal="true"
    >
      <header class="border-grey-200 flex items-center justify-between gap-3 border-b px-5 py-3">
        <h4 v-if="title" id="dialog-label" class="text-grey-800 text-base font-semibold">
          {{ title }}
        </h4>
        <slot v-else name="header" />
        <CloseBtn v-if="closeable" :small="true" @close="emit('close')" />
      </header>

      <div class="space-y-4 px-5 py-4">
        <slot />
      </div>

      <footer
        v-if="$slots.footer"
        class="border-grey-200 flex items-center justify-end gap-2 border-t px-5 py-3"
      >
        <slot name="footer" />
      </footer>
    </div>
  </div>
</template>
