<script setup lang="ts">
import CloseBtn from '@/components/Common/Buttons/CloseBtn.vue'

defineProps({
  title: { type: String, default: '' },
  variant: { type: String, default: '' },
  closeable: { type: Boolean, default: true },
  placing: { type: String, default: 'center' },
  wrapper: { type: String, default: 'full' },
})

const emit = defineEmits(['close'])

function onClose() {
  emit('close')
}
</script>

<template>
  <div
    class="app-modal modal | z-20 grid overflow-y-auto p-4"
    :class="`place-items-${placing}`"
    :data-variant="wrapper"
  >
    <div
      class="panel pointer-events-auto"
      role="dialog"
      aria-describedby="dialog-label"
      aria-modal="true"
      :data-variant="variant"
    >
      <header class="panel__header">
        <slot name="header">
          <h4 v-if="title" id="dialog-label" class="heading-4">{{ title }}</h4>
        </slot>
        <CloseBtn
          v-if="closeable"
          :small="false"
          class="absolute right-8 top-3"
          @close="onClose"
        />
      </header>

      <div class="panel__content content | -mx-6 space-y-4 px-6">
        <slot />
      </div>

      <footer v-if="$slots.footer" class="panel__footer">
        <slot name="footer" />
      </footer>
    </div>
  </div>
</template>
