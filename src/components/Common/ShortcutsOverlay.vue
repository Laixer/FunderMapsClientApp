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
  <Modal title="Sneltoetsen" wide @close="$emit('close')">
    <div class="grid gap-6 sm:grid-cols-2">
      <section v-for="group in SHORTCUT_GROUPS" :key="group.title">
        <h3 class="studio-caption mb-2.5">{{ group.title }}</h3>
        <dl class="flex flex-col gap-1.5">
          <div
            v-for="shortcut in group.shortcuts"
            :key="shortcut.keys"
            class="flex items-baseline justify-between gap-3"
          >
            <dt class="text-md text-body">{{ shortcut.label }}</dt>
            <dd class="flex shrink-0 items-center gap-1">
              <kbd
                v-for="key in chords(shortcut.keys)"
                :key="key"
                class="text-xs rounded-sm border border-line bg-canvas px-1.5 py-0.5 font-mono text-strong"
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
