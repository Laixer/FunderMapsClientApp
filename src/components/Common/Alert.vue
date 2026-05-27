<script setup lang="ts">
import { computed } from 'vue'

type AlertType = 'danger' | 'success' | 'info' | 'warning'

const props = withDefaults(
  defineProps<{
    type?: AlertType
    closeable?: boolean
  }>(),
  {
    type: 'danger',
    closeable: false,
  },
)

const emit = defineEmits(['close'])

const tone = computed(() => {
  switch (props.type) {
    case 'success':
      return {
        wrap: 'border-l-green-500 bg-green-50/60 text-green-800',
        btn: 'text-green-700 hover:bg-green-100',
      }
    case 'info':
      return {
        wrap: 'border-l-blue-500 bg-blue-100/40 text-blue-900',
        btn: 'text-blue-900 hover:bg-blue-200/60',
      }
    case 'warning':
      return {
        wrap: 'border-l-yellow-500 bg-yellow-100/70 text-grey-800',
        btn: 'text-grey-800 hover:bg-yellow-100',
      }
    case 'danger':
    default:
      return {
        wrap: 'border-l-red-500 bg-red-50 text-red-800',
        btn: 'text-red-700 hover:bg-red-50',
      }
  }
})
</script>

<template>
  <div
    class="relative flex items-start gap-3 rounded-r-md border border-l-4 border-grey-200 p-3 text-sm"
    :class="tone.wrap"
    role="alert"
  >
    <svg
      class="mt-0.5 inline h-4 w-4 shrink-0"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"
      />
    </svg>
    <span class="sr-only">Info</span>
    <div class="min-w-0 flex-1">
      <slot />
    </div>
    <button
      v-if="closeable"
      type="button"
      class="-m-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded p-1 transition-colors"
      :class="tone.btn"
      aria-label="Sluiten"
      @click="emit('close')"
    >
      <span class="sr-only">Sluiten</span>
      <svg
        class="h-3 w-3"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 14 14"
      >
        <path
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
        />
      </svg>
    </button>
  </div>
</template>
