<script setup lang="ts">
import { ref } from 'vue'
import Modal from '@/components/Common/Modal.vue'
import Textarea from '@/components/Common/Inputs/Textarea.vue'
import Button from '@/components/Common/Buttons/Button.vue'
import Alert from '@/components/Common/Alert.vue'

const emit = defineEmits<{
  close: []
  submit: [message: string]
}>()

const message = ref('')
const error = ref<string | null>(null)
const submitting = ref(false)

async function onSubmit() {
  if (submitting.value) return
  if (!message.value.trim()) {
    error.value = 'Geef een toelichting voor de afkeuring.'
    return
  }
  submitting.value = true
  error.value = null
  try {
    emit('submit', message.value.trim())
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <Modal title="Rapport afkeuren" @close="emit('close')">
    <Alert v-if="error" :closeable="true" @close="error = null">{{ error }}</Alert>

    <form class="space-y-4" @submit.prevent="onSubmit">
      <Textarea
        v-model="message"
        label="Toelichting"
        placeholder="Waarom wordt dit rapport afgekeurd?"
        :rows="5"
        required
      />

      <div class="flex justify-end gap-3">
        <Button label="Annuleren" outline @click="emit('close')" />
        <Button label="Afkeuren" danger type="submit" :disabled="submitting" @click="onSubmit" />
      </div>
    </form>
  </Modal>
</template>
