<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  id?: string
  label?: string
  disabled?: boolean
}>()

const model = defineModel<boolean | null>()
const identifier = computed(() => props.id ?? `cb-${crypto.randomUUID()}`)
</script>

<template>
  <label :for="identifier" class="inline-flex cursor-pointer items-center gap-2">
    <input
      :id="identifier"
      type="checkbox"
      :disabled="disabled"
      v-model="model"
      class="h-4 w-4 rounded border-grey-400 text-green-500 focus:ring-green-500"
    />
    <span v-if="label" class="text-sm text-grey-800">{{ label }}</span>
  </label>
</template>
