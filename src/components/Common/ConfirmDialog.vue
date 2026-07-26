<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'

import Modal from '@/components/Common/Modal.vue'
import Button from '@/components/Common/Buttons/Button.vue'
import { currentConfirm, resolveConfirm } from '@/services/confirm'

/**
 * Host for `confirmAction()`. Mounted once by the shell; renders only while a
 * question is outstanding.
 */
const request = computed(() => currentConfirm.value)

function onKeydown(event: KeyboardEvent) {
  if (!request.value) return
  // Enter confirms — the dialog is the only thing on screen, so there is nothing
  // else the key could mean. Escape is handled by Modal, which emits close.
  if (event.key === 'Enter') {
    event.preventDefault()
    resolveConfirm(true)
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  // Unmounting with a question outstanding would leave its caller awaiting
  // forever; treat a vanished dialog as a "no".
  if (currentConfirm.value) resolveConfirm(false)
})
</script>

<template>
  <Modal v-if="request" :title="request.title" @close="resolveConfirm(false)">
    <p v-if="request.body" class="text-md whitespace-pre-line text-body">
      {{ request.body }}
    </p>

    <template #footer>
      <Button :label="request.cancelLabel ?? 'Annuleren'" @click="resolveConfirm(false)" />
      <Button
        :variant="request.danger ? 'danger' : 'primary'"
        :label="request.confirmLabel ?? 'Doorgaan'"
        @click="resolveConfirm(true)"
      />
    </template>
  </Modal>
</template>
