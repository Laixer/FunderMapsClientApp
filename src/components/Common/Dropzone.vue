<script setup lang="ts">
import { ref, useId } from 'vue'

import Icon from '@/components/Common/Icon.vue'
import { formatBytes } from '@/services/documentFile'

export interface AttachedFile {
  name: string
  sizeBytes: number | null
  /** True once the upload has come back with a storage name. */
  uploaded: boolean
}

/**
 * Drop a document here, or pick one.
 *
 * The bare `<input type="file">` it replaces gave no hint what belonged in it,
 * no size limit until the request failed, and no confirmation beyond a line of
 * text. This says what it wants, what it will do with it ("naam en datum worden
 * uitgelezen"), and then shows the file as a row you can remove.
 *
 * The size cap is enforced here rather than only server-side so a 90 MB scan
 * fails in a hundred milliseconds instead of after a two-minute upload.
 */
const props = withDefaults(
  defineProps<{
    file?: AttachedFile | null
    uploading?: boolean
    error?: string | null
    accept?: string
    maxBytes?: number
  }>(),
  {
    file: null,
    uploading: false,
    error: null,
    accept: 'application/pdf,image/*',
    maxBytes: 40 * 1024 * 1024,
  },
)

const emit = defineEmits<{ pick: [file: File]; remove: []; reject: [reason: string] }>()

const id = useId()
const input = ref<HTMLInputElement | null>(null)
const dragging = ref(false)

function accepted(file: File): boolean {
  if (file.size > props.maxBytes) {
    emit('reject', `${file.name} is groter dan ${formatBytes(props.maxBytes)}.`)
    return false
  }
  return true
}

function take(files: FileList | null) {
  const file = files?.[0]
  if (!file) return
  if (accepted(file)) emit('pick', file)
}

function onDrop(event: DragEvent) {
  dragging.value = false
  take(event.dataTransfer?.files ?? null)
}

function onChange(event: Event) {
  take((event.target as HTMLInputElement).files)
  // Clear the input so re-picking the same file after a remove still fires.
  if (input.value) input.value.value = ''
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <div
      class="flex flex-col items-center gap-1.5 rounded-xl border border-dashed px-3.5 py-5 text-center"
      :class="
        dragging ? 'border-green bg-green-wash' : 'border-line-dashed bg-raised hover:border-green'
      "
      @dragover.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
    >
      <label :for="id" class="text-lg cursor-pointer font-bold text-strong">
        Sleep de PDF hierheen
      </label>
      <p class="text-base text-subtle">
        of
        <label :for="id" class="cursor-pointer font-semibold text-blue hover:underline">
          kies een bestand
        </label>
        · max {{ formatBytes(maxBytes) }}
      </p>
      <p class="text-xs font-mono text-label">naam en datum worden uitgelezen</p>
      <input
        :id="id"
        ref="input"
        type="file"
        class="sr-only"
        :accept="accept"
        :disabled="uploading"
        @change="onChange"
      />
    </div>

    <p v-if="uploading" class="text-md text-muted">Bezig met uploaden…</p>
    <p v-if="error" class="text-md text-red">{{ error }}</p>

    <div
      v-if="file"
      class="flex items-center gap-2.5 rounded-xl border border-line px-2.5 py-2"
    >
      <span
        class="inline-flex h-8 w-[26px] shrink-0 items-center justify-center rounded-xs border border-line bg-canvas text-faint"
      >
        <Icon name="clipboard" size="xs" />
      </span>
      <span class="min-w-0 flex-1">
        <span class="text-md block truncate font-semibold text-body" :title="file.name">
          {{ file.name }}
        </span>
        <span class="text-xs block font-mono" :class="file.uploaded ? 'text-green-ink' : 'text-label'">
          {{ file.uploaded ? 'geüpload' : 'nog niet geüpload' }}
          <template v-if="formatBytes(file.sizeBytes)"> · {{ formatBytes(file.sizeBytes) }}</template>
        </span>
      </span>
      <button
        type="button"
        class="shrink-0 px-1 leading-none text-ghost hover:text-red"
        aria-label="Document loskoppelen"
        @click="emit('remove')"
      >
        ×
      </button>
    </div>
  </div>
</template>
