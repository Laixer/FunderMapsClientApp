<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'

import CloseBtn from '@/components/Common/Buttons/CloseBtn.vue'

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

onMounted(() => window.addEventListener('keydown', handleKey))
onBeforeUnmount(() => window.removeEventListener('keydown', handleKey))

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
      class="relative w-full max-w-xl rounded-md border border-grey-200 bg-white shadow-lg"
      role="dialog"
      aria-describedby="dialog-label"
      aria-modal="true"
    >
      <header
        class="flex items-center justify-between gap-3 border-b border-grey-200 px-5 py-3"
      >
        <h4 v-if="title" id="dialog-label" class="text-base font-semibold text-grey-800">
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
        class="flex items-center justify-end gap-2 border-t border-grey-200 px-5 py-3"
      >
        <slot name="footer" />
      </footer>
    </div>
  </div>
</template>
