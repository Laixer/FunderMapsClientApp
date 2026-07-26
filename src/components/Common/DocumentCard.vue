<script setup lang="ts">
import { computed, ref } from 'vue'

import Icon from '@/components/Common/Icon.vue'
import Modal from '@/components/Common/Modal.vue'
import Panel from '@/components/Common/Panel.vue'
import {
  displayFilename,
  extensionOf,
  fileIcon,
  formatBytes,
  isPreviewableImage,
  isUnnamed,
  type DocumentFileInfo,
} from '@/services/documentFile'

/**
 * The dossier's source document, named and openable.
 *
 * Replaces a button labelled "Document" that gave no clue what was behind it —
 * a 40 MB scan and a two-line note looked identical. Images get a thumbnail and
 * open full size in place, because a foundation photo is something you look at,
 * not something you download and hunt for in ~/Downloads.
 */
const props = defineProps<{
  /** Null while loading, or when the lookup failed. */
  file: DocumentFileInfo | null
  loading?: boolean
}>()

const showFullSize = ref(false)
/** Thumbnails fail loudly if the link expired or the object is gone. */
const previewFailed = ref(false)

const label = computed(() => displayFilename(props.file))

const meta = computed(() => {
  const parts: string[] = []
  const ext = extensionOf(props.file)
  if (ext) parts.push(ext.toUpperCase())
  const size = formatBytes(props.file?.sizeBytes)
  if (size) parts.push(size)
  return parts.join(' · ')
})

const showThumbnail = computed(() => isPreviewableImage(props.file) && !previewFailed.value)

function open() {
  if (!props.file) return
  if (showThumbnail.value) {
    showFullSize.value = true
    return
  }
  window.open(props.file.accessLink, '_blank', 'noopener')
}
</script>

<template>
  <Panel caption="BRONDOCUMENT">
    <p v-if="loading" class="text-md text-muted">Laden…</p>

    <p v-else-if="!file" class="text-md text-muted">Het document kon niet worden opgehaald.</p>

    <button
      v-else
      type="button"
      class="group flex w-full items-center gap-3 rounded-xl border border-line px-3 py-2.5 text-left hover:border-line-hover hover:bg-raised"
      @click="open"
    >
      <!-- Thumbnail for images, striped placeholder for everything else — the
           stripe reads as "a page" without pretending to be one. -->
      <img
        v-if="showThumbnail"
        :src="file.accessLink"
        :alt="label"
        class="h-[42px] w-[34px] shrink-0 rounded-sm border border-line object-cover"
        loading="lazy"
        @error="previewFailed = true"
      />
      <span
        v-else
        class="inline-flex h-[42px] w-[34px] shrink-0 items-center justify-center rounded-sm border border-line bg-canvas text-faint"
      >
        <Icon :name="fileIcon(file)" size="sm" />
      </span>

      <span class="min-w-0 flex-1">
        <!-- The storage GUID lives in the tooltip: useless as a label, but the
             only way to find the object in Spaces when something is wrong. -->
        <span
          class="text-lg block truncate font-semibold text-body group-hover:text-green-ink"
          :title="file.storageName"
        >
          {{ label }}
        </span>
        <span class="text-xs block font-mono text-faint">
          {{ meta || 'onbekend formaat' }}
          <!-- Only 22% of inquiries carry a file_resources row, so say plainly
               that the name is missing rather than implying the file is odd. -->
          <template v-if="isUnnamed(file)"> · naam niet bewaard bij upload</template>
        </span>
      </span>

      <span aria-hidden="true" class="shrink-0 text-faint group-hover:text-green-ink">
        {{ showThumbnail ? '⤢' : '→' }}
      </span>
    </button>

    <Modal v-if="showFullSize" :title="label" wide @close="showFullSize = false">
      <img :src="file!.accessLink" :alt="label" class="mx-auto max-h-[70vh] w-auto rounded-xl" />
      <template #footer>
        <a
          :href="file!.accessLink"
          target="_blank"
          rel="noopener"
          class="text-md font-semibold text-green-ink underline underline-offset-2"
        >
          Downloaden
        </a>
      </template>
    </Modal>
  </Panel>
</template>
