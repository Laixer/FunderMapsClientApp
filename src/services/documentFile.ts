/**
 * The dossier's source document, as the overview page needs to describe it.
 *
 * Mirrors `DocumentFileInfo` in `FunderMapsApi/src/lib/document-file.ts`, served
 * by `GET /api/{inquiry,recovery}/:id/download`.
 *
 * `document_file` on the record is only a storage name — `crypto.randomUUID()`
 * plus an extension — so the page had nothing to show but a button labelled
 * "Document". The real name lives in `application.file_resources`, which uploads
 * predating that table do not have, hence the nullable fields and the fallback.
 */

import type { IconName } from '@/components/Common/icons'

export interface DocumentFileInfo {
  accessLink: string
  /** Storage filename (the GUID). Always present. */
  storageName: string
  originalFilename: string | null
  mimeType: string | null
  sizeBytes: number | null
}

/**
 * Image types a browser will actually render inline.
 *
 * `image/tiff` is on the upload whitelist but no major browser displays it, so
 * previewing it would show a broken image instead of a file to download.
 */
const PREVIEWABLE_IMAGE_MIMES: ReadonlySet<string> = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/bmp',
  'image/webp',
])

export function isPreviewableImage(file: DocumentFileInfo | null): boolean {
  return file !== null && file.mimeType !== null && PREVIEWABLE_IMAGE_MIMES.has(file.mimeType)
}

/**
 * Best available human label.
 *
 * Falls back to a plain "Document" rather than the storage name: that name is a
 * bare GUID, and only 22% of inquiries (5,863 of 26,649) have a
 * `file_resources` row to improve on it — so showing it would make four
 * dossiers in five noisier than the button this replaces. The GUID stays
 * available as a tooltip for anyone who needs to find the object.
 */
export function displayFilename(file: DocumentFileInfo | null): string {
  return file?.originalFilename?.trim() || 'Document'
}

/** True when all we have is the storage GUID — worth saying so rather than pretending. */
export function isUnnamed(file: DocumentFileInfo | null): boolean {
  return file !== null && !file.originalFilename?.trim()
}

const EXTENSION_ICONS: Record<string, IconName> = {
  pdf: 'clipboard',
  txt: 'clipboard',
}

export function fileIcon(file: DocumentFileInfo | null): IconName {
  if (isPreviewableImage(file)) return 'eye'
  // Not `(ext && MAP[ext]) ?? fallback`: an empty-string extension makes that
  // expression `''`, which is not nullish, so the fallback never fires and the
  // icon name is invalid.
  const ext = extensionOf(file)
  const icon = ext ? EXTENSION_ICONS[ext] : undefined
  return icon ?? 'clipboard'
}

export function extensionOf(file: DocumentFileInfo | null): string | null {
  const name = file?.originalFilename?.trim() || file?.storageName
  if (!name) return null
  const dot = name.lastIndexOf('.')
  if (dot <= 0 || dot === name.length - 1) return null
  return name.slice(dot + 1).toLowerCase()
}

/**
 * Human file size. Binary units, because that is what a file manager shows and
 * the number is for orientation ("is this the 40 MB scan or the 200 kB note?"),
 * not for accounting.
 */
export function formatBytes(bytes: number | null | undefined): string | null {
  if (bytes == null || bytes < 0) return null
  if (bytes < 1024) return `${bytes} B`
  const units = ['kB', 'MB', 'GB']
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  // One decimal below 10 (3.4 MB), none above (42 MB) — precision where it reads.
  const rounded = value < 10 ? Math.round(value * 10) / 10 : Math.round(value)
  return `${rounded.toString().replace('.', ',')} ${units[unit]}`
}
