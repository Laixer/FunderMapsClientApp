<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    id?: string
    label?: string
    placeholder?: string
    rows?: number
    required?: boolean
    disabled?: boolean
    validationStatus?: 'none' | 'success' | 'error'
    validationMessage?: string
  }>(),
  { rows: 4, required: false, disabled: false, validationStatus: 'none' },
)

const model = defineModel<string | null>()
const identifier = computed(() => props.id ?? `textarea-${crypto.randomUUID()}`)
</script>

<template>
  <div class="input--text">
    <label v-if="label" :for="identifier" class="input__label">{{ label }}</label>
    <div class="input-field" :data-validation="validationStatus">
      <textarea
        :id="identifier"
        :name="identifier"
        :rows="rows"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        v-model="model"
        class="w-full resize-y rounded border border-grey-400 p-2"
      />
    </div>
    <div
      v-if="validationMessage && validationStatus !== 'none'"
      class="input__message | validation__message"
      :data-variant="validationStatus"
    >
      {{ validationMessage }}
    </div>
  </div>
</template>
