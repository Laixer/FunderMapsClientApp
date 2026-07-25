<script setup lang="ts">
import Modal from '@/components/Common/Modal.vue'
import { SHORTCUT_GROUPS } from '@/services/shortcuts'

/**
 * The keyboard help, generated from the same table the handlers read — so a
 * binding cannot exist without being documented, or be documented without
 * existing.
 */
defineEmits<{ close: [] }>()

/** `g v` is two presses, not a chord; render the parts separately. */
function chords(keys: string): string[] {
  return keys.split(' ')
}
</script>

<template>
  <Modal title="Sneltoetsen" @close="$emit('close')">
    <div class="grid gap-6 sm:grid-cols-2">
      <section v-for="group in SHORTCUT_GROUPS" :key="group.title">
        <h5 class="text-grey-700 mb-2 text-xs font-semibold tracking-wide uppercase">
          {{ group.title }}
        </h5>
        <dl class="space-y-1.5">
          <div
            v-for="shortcut in group.shortcuts"
            :key="shortcut.keys"
            class="flex items-baseline justify-between gap-3"
          >
            <dt class="text-grey-800 text-sm">{{ shortcut.label }}</dt>
            <dd class="flex shrink-0 items-center gap-1">
              <kbd
                v-for="key in chords(shortcut.keys)"
                :key="key"
                class="border-grey-200 bg-grey-100 text-grey-800 rounded border px-1.5 py-0.5 font-mono text-xs"
              >
                {{ key }}
              </kbd>
            </dd>
          </div>
        </dl>
      </section>
    </div>
  </Modal>
</template>
