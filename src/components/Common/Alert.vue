<script setup lang="ts">
const emit = defineEmits(['close'])
const props = withDefaults(
  defineProps<{ type?: 'danger' | 'success'; closeable?: boolean }>(),
  { type: 'danger', closeable: false },
)

const cls =
  props.type === 'danger'
    ? ['text-red-800', 'bg-red-50']
    : ['text-green-800', 'bg-green-50']
</script>

<template>
  <div class="mb-4 flex items-start gap-3 rounded-lg p-4 text-sm" :class="cls" role="alert">
    <div class="flex-1">
      <slot />
    </div>
    <button
      v-if="closeable"
      type="button"
      class="text-current hover:opacity-70"
      aria-label="Sluiten"
      @click="emit('close')"
    >
      ×
    </button>
  </div>
</template>
