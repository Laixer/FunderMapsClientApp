<script setup lang="ts">
import { computed, ref } from 'vue'

import Icon from '@/components/Common/Icon.vue'
import Modal from '@/components/Common/Modal.vue'
import Spinner from '@/components/Common/Spinner.vue'
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
  <div class="border-grey-200 rounded-md border bg-white p-4">
    <h4 class="text-grey-700 mb-3 text-xs font-semibold tracking-wide uppercase">Brondocument</h4>

    <p v-if="loading" class="text-grey-700 flex items-center gap-2 text-sm">
      <Spinner />
    </p>

    <p v-else-if="!file" class="text-grey-700 text-sm">Het document kon niet worden opgehaald.</p>

    <button
      v-else
      type="button"
      class="hover:bg-grey-100 group -m-2 flex w-full items-center gap-3 rounded p-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500"
      @click="open"
    >
      <!-- Thumbnail for images, glyph for everything else. -->
      <img
        v-if="showThumbnail"
        :src="file.accessLink"
        :alt="label"
        class="border-grey-200 h-12 w-12 shrink-0 rounded border object-cover"
        loading="lazy"
        @error="previewFailed = true"
      />
      <span
        v-else
        class="bg-grey-100 text-grey-700 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded"
      >
        <Icon :name="fileIcon(file)" size="md" />
      </span>

      <span class="min-w-0 flex-1">
        <!-- The storage GUID lives in the tooltip: useless as a label, but the
             only way to find the object in Spaces when something is wrong. -->
        <span
          class="text-grey-800 block truncate text-sm font-medium group-hover:text-green-700"
          :title="file.storageName"
        >
          {{ label }}
        </span>
        <span class="text-grey-700 block text-xs">
          {{ meta || 'onbekend formaat' }}
          <!-- Only 22% of inquiries carry a file_resources row, so say plainly
               that the name is missing rather than implying the file is odd. -->
          <template v-if="isUnnamed(file)"> · naam niet bewaard bij upload</template>
        </span>
      </span>

      <Icon
        :name="showThumbnail ? 'eye' : 'arrowRight'"
        size="sm"
        class="text-grey-400 shrink-0 group-hover:text-green-700"
      />
    </button>

    <Modal v-if="showFullSize" :title="label" @close="showFullSize = false">
      <img :src="file!.accessLink" :alt="label" class="mx-auto max-h-[70vh] w-auto rounded" />
      <template #footer>
        <a
          :href="file!.accessLink"
          target="_blank"
          rel="noopener"
          class="text-sm font-medium text-green-700 underline underline-offset-2"
        >
          Downloaden
        </a>
      </template>
    </Modal>
  </div>
</template>
