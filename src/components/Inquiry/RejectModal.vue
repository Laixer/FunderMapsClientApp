<script setup lang="ts">
import { ref } from 'vue'

import Button from '@/components/Common/Buttons/Button.vue'
import Callout from '@/components/Common/Callout.vue'
import Field from '@/components/Common/Field.vue'
import Modal from '@/components/Common/Modal.vue'

/**
 * Afkeuren, with a reason.
 *
 * The motivation is required because it is the only thing the opsteller has to
 * work from — it lands in the dossier's trail and in the mail, and a rejection
 * without one costs a round trip just to ask what was wrong.
 */
const emit = defineEmits<{
  close: []
  submit: [message: string]
}>()

const message = ref('')
const error = ref<string | null>(null)
const submitting = ref(false)

function onSubmit() {
  if (submitting.value) return
  if (!message.value.trim()) {
    error.value = 'Geef een toelichting, anders weet de opsteller niet wat er mis is.'
    return
  }
  submitting.value = true
  error.value = null
  emit('submit', message.value.trim())
}
</script>

<template>
  <Modal title="Rapport afkeuren" @close="emit('close')">
    <Callout v-if="error" tone="red">{{ error }}</Callout>

    <Field
      v-model="message"
      label="Toelichting"
      kind="textarea"
      required
      :rows="5"
      placeholder="Wat moet er aangepast worden voordat dit rapport kan worden vastgesteld?"
      hint="Komt in de tijdlijn van het dossier en in de mail aan de opsteller."
    />

    <template #footer>
      <Button label="Annuleren" @click="emit('close')" />
      <Button variant="danger" label="Afkeuren" :disabled="submitting" @click="onSubmit" />
    </template>
  </Modal>
</template>
