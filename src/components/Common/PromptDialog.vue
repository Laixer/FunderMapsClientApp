<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import Modal from '@/components/Common/Modal.vue'
import Button from '@/components/Common/Buttons/Button.vue'
import Field from '@/components/Common/Field.vue'
import { currentPrompt, resolvePrompt } from '@/services/prompt'

/**
 * Host for `promptText()`. Mounted once by the shell, next to `ConfirmDialog`;
 * renders only while a question is outstanding.
 *
 * The focus is Modal's doing: it opens on the text field (the first form
 * control), stays inside the sheet, and goes back to where it was on close.
 */
const request = computed(() => currentPrompt.value)

const text = ref('')
// Every question starts from its own text, not from what the last one left.
watch(request, (next) => (text.value = next?.value ?? ''), { immediate: true })

/** What the caller gets. Empty means there is nothing to confirm yet. */
const answer = computed(() => text.value.trim())

function submit() {
  if (answer.value) resolvePrompt(answer.value)
}

function onKeydown(event: KeyboardEvent) {
  if (!request.value) return
  // Enter in the text field saves. A key pressed on a button belongs to that
  // button, as in ConfirmDialog: Enter on "Annuleren" must not save. Escape is
  // handled by Modal. `isComposing`: Enter that picks an IME candidate is not
  // an answer.
  if (event.key === 'Enter' && !event.isComposing) {
    const target = document.activeElement
    if (target instanceof HTMLButtonElement || target instanceof HTMLAnchorElement) return
    event.preventDefault()
    submit()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  // A dialog that vanishes with a question outstanding answers "no", so its
  // caller is not left awaiting forever.
  if (currentPrompt.value) resolvePrompt(null)
})
</script>

<template>
  <Modal v-if="request" :title="request.title" @close="resolvePrompt(null)">
    <Field v-model="text" :label="request.label" :placeholder="request.placeholder" />

    <template #footer>
      <Button :label="request.cancelLabel ?? 'Annuleren'" @click="resolvePrompt(null)" />
      <Button
        variant="primary"
        :label="request.confirmLabel ?? 'Opslaan'"
        :disabled="!answer"
        @click="submit"
      />
    </template>
  </Modal>
</template>
