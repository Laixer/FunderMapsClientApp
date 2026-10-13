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
  // Enter confirms, as it always did: the dialog opens with the focus on its
  // confirm button (on "cancel" for a `cautious` question, where Enter then
  // cancels). But a key pressed on a button belongs to that button:
  // Enter on "Annuleren" used to confirm as well, a delete included, because
  // this listener answered before the button did. Escape is handled by Modal.
  if (event.key === 'Enter') {
    const target = document.activeElement
    if (target instanceof HTMLButtonElement || target instanceof HTMLAnchorElement) return
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
      <Button
        :label="request.cancelLabel ?? 'Annuleren'"
        :data-autofocus="request.cautious ? '' : undefined"
        @click="resolveConfirm(false)"
      />
      <Button
        :variant="request.danger ? 'danger' : 'primary'"
        :label="request.confirmLabel ?? 'Doorgaan'"
        :data-autofocus="request.cautious ? undefined : ''"
        @click="resolveConfirm(true)"
      />
    </template>
  </Modal>
</template>
