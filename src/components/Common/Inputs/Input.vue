<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    id?: string
    label?: string
    type?: string
    placeholder?: string
    autocomplete?: string
    instruction?: string
    required?: boolean
    disabled?: boolean
    validationStatus?: 'none' | 'success' | 'error'
    validationMessage?: string
    tabindex?: number
  }>(),
  { type: 'text', required: false, disabled: false, validationStatus: 'none' },
)

const model = defineModel()

const identifier = computed(() => props.id ?? `input-${crypto.randomUUID()}`)
</script>

<template>
  <div class="input--text">
    <label v-if="label" :for="identifier" class="input__label">{{ label }}</label>
    <div v-if="instruction" class="input__message">{{ instruction }}</div>
    <div class="input-field" :data-validation="validationStatus">
      <div v-if="$slots.before" class="input-field__before"><slot name="before" /></div>
      <input
        :type="type"
        :id="identifier"
        :name="identifier"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :required="required"
        :disabled="disabled"
        :tabindex="tabindex"
        v-model="model"
      />
      <div v-if="$slots.after" class="input-field__after"><slot name="after" /></div>
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
