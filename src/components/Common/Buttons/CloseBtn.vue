<script setup lang="ts">
import CloseIcon from '@assets/svg/icons/close.svg'

defineProps({
  small: { type: Boolean, default: true },
  disabled: { type: Boolean, default: false },
  label: { type: String, default: 'sluit' },
})

defineEmits(['close'])
</script>

<template>
  <button
    class="button button--link | group ml-auto text-blue-900 hover:text-red-500"
    :class="small ? 'text-sm' : ''"
    :disabled="disabled"
    @click="() => (disabled ? undefined : $emit('close'))"
  >
    <span class="sr-only">{{ label }}</span>
    <CloseIcon
      class="aspect-square text-red-500"
      :class="small ? 'h-3' : 'h-3.5'"
      aria-hidden="true"
    />
  </button>
</template>
