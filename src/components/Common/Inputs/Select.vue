<script setup lang="ts">
import { computed } from 'vue'

export interface SelectOption {
  value: string | number | boolean | null
  label: string
}

const props = withDefaults(
  defineProps<{
    id?: string
    label?: string
    options?: SelectOption[]
    instruction?: string
    placeholder?: string
    required?: boolean
    disabled?: boolean
    clearable?: boolean
    validationStatus?: 'none' | 'success' | 'error'
    validationMessage?: string
  }>(),
  { required: false, disabled: false, clearable: false, validationStatus: 'none' },
)

const model = defineModel()
const identifier = computed(() => props.id ?? `select-${crypto.randomUUID()}`)
</script>

<template>
  <div class="input--select">
    <label v-if="label" :for="identifier" class="input__label">{{ label }}</label>
    <div v-if="instruction" class="input__message">{{ instruction }}</div>
    <div class="input-field" :data-validation="validationStatus">
      <select
        :name="identifier"
        :id="identifier"
        :required="required"
        :disabled="disabled"
        v-model="model"
      >
        <option v-if="placeholder" :value="null" :disabled="!clearable">{{ placeholder }}</option>
        <option v-for="(option, i) in options" :key="i" :value="option.value">
          {{ option.label }}
        </option>
      </select>
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
