<script setup lang="ts">
import { ref } from 'vue'
import { onClickOutside, onKeyStroke } from '@vueuse/core'

import { INQUIRY_TYPE_LABELS, STATUS_META } from '@/services/inquiryEnums'
import type { ExplorerQuery } from '@/services/explorer'

/**
 * The `+ Filter` popover.
 *
 * Multi-select on purpose: "te controleren óf afgekeurd" is a real question
 * people ask, and a single-choice dropdown cannot express it — which is why the
 * old list view had to smuggle two-status lanes past its own Select as an
 * undismissable chip. Here a status set is just a set.
 *
 * Everything applies immediately. There is no Apply button, because the result
 * count is right next to the popover and watching it move is the fastest way to
 * tell whether you asked the right question.
 */
const props = defineProps<{ query: ExplorerQuery }>()

const emit = defineEmits<{ update: [query: ExplorerQuery] }>()

const open = ref(false)
const root = ref<HTMLElement | null>(null)
onClickOutside(root, () => (open.value = false))
onKeyStroke('Escape', () => (open.value = false))

const STATUSES = Object.entries(STATUS_META).map(([value, meta]) => ({
  value: Number(value),
  label: meta.label,
}))

const TYPES = Object.entries(INQUIRY_TYPE_LABELS).map(([value, label]) => ({
  value: Number(value),
  label,
}))

function toggle(list: number[], value: number): number[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

function setStatus(value: number) {
  emit('update', { ...props.query, status: toggle(props.query.status, value), page: 1 })
}

function setType(value: number) {
  emit('update', { ...props.query, type: toggle(props.query.type, value), page: 1 })
}

function setMine(value: 'reviewer' | 'creator' | null) {
  emit('update', { ...props.query, mine: props.query.mine === value ? null : value, page: 1 })
}
</script>

<template>
  <div ref="root" class="relative">
    <button
      type="button"
      class="text-base rounded-full border border-dashed border-line-strong bg-surface px-2.5 py-[5px] text-subtle hover:border-line-hover hover:text-strong"
      :aria-expanded="open"
      @click="open = !open"
    >
      + Filter
    </button>

    <div
      v-if="open"
      class="studio-fade absolute top-full left-0 z-30 mt-2 flex w-[420px] flex-col gap-4 rounded-2xl border border-line bg-surface p-4 shadow-overlay"
    >
      <section>
        <h3 class="studio-label mb-2">STATUS</h3>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="status in STATUSES"
            :key="status.value"
            type="button"
            class="text-base rounded-full border px-2.5 py-1 font-medium"
            :class="
              query.status.includes(status.value)
                ? 'border-blue-border bg-blue-tint text-blue-ink'
                : 'border-line bg-surface text-muted hover:border-line-hover'
            "
            @click="setStatus(status.value)"
          >
            {{ status.label }}
          </button>
        </div>
      </section>

      <section>
        <h3 class="studio-label mb-2">TOEWIJZING</h3>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="option in [
              { value: 'reviewer' as const, label: 'Ik beoordeel' },
              { value: 'creator' as const, label: 'Ik stelde op' },
            ]"
            :key="option.value"
            type="button"
            class="text-base rounded-full border px-2.5 py-1 font-medium"
            :class="
              query.mine === option.value
                ? 'border-blue-border bg-blue-tint text-blue-ink'
                : 'border-line bg-surface text-muted hover:border-line-hover'
            "
            @click="setMine(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </section>

      <section>
        <h3 class="studio-label mb-2">TYPE</h3>
        <!-- Fifteen types is more than fits; the list scrolls rather than
             growing the popover past the filter bar it hangs from. -->
        <div class="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
          <button
            v-for="type in TYPES"
            :key="type.value"
            type="button"
            class="text-base rounded-full border px-2.5 py-1 font-medium"
            :class="
              query.type.includes(type.value)
                ? 'border-blue-border bg-blue-tint text-blue-ink'
                : 'border-line bg-surface text-muted hover:border-line-hover'
            "
            @click="setType(type.value)"
          >
            {{ type.label }}
          </button>
        </div>
        <!-- Said plainly rather than hidden: `GET /inquiry` has no type filter,
             so this one narrows the page you are looking at, not the query. -->
        <p class="text-sm mt-2 text-label">Type filtert de zichtbare pagina, niet de hele set.</p>
      </section>
    </div>
  </div>
</template>
