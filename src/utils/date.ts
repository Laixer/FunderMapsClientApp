/**
 * Dates, in the two registers the studio uses.
 *
 * Prose (`26 apr 2026`) for headers, callouts and anywhere a date is part of a
 * sentence. Mono `dd-mm-yyyy` for table columns and metadata lines, where the
 * point is that a hundred of them line up on their separators and you can scan
 * the year without reading any of them.
 */

/** `26 apr 2026` — a date inside a sentence. */
export function formatDate(iso: string | null | undefined): string {
  const d = parse(iso)
  if (!d) return '—'
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** `26-04-2026` — a date inside a column. Always the same width. */
export function formatDateShort(iso: string | null | undefined): string {
  const d = parse(iso)
  if (!d) return '—'
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${day}-${month}-${d.getFullYear()}`
}

/**
 * Format an ISO timestamp with the time of day, for a trail where ordering
 * within a day matters ("aangeboden 14:32, afgekeurd 16:05").
 */
export function formatDateTime(iso: string | null | undefined): string {
  const d = parse(iso)
  if (!d) return '—'
  return d.toLocaleString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** `12:04` — the autosave stamp, where only the time of day is news. */
export function formatTime(iso: string | null | undefined): string {
  const d = parse(iso)
  if (!d) return '—'
  return d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
}

/**
 * How long ago, in a couple of characters: `4m`, `3u`, `2d`.
 *
 * For the "recent geopend" rail, where the exact moment is noise and the point
 * is only whether this was before or after lunch. Falls back to a short date
 * past a week, because "9d" stops being a useful way to say "last Tuesday".
 */
export function formatRelative(iso: string | null | undefined): string {
  const d = parse(iso)
  if (!d) return '—'
  const seconds = Math.max(0, Math.round((Date.now() - d.getTime()) / 1000))
  if (seconds < 60) return 'nu'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}u`
  const days = Math.round(hours / 24)
  if (days <= 7) return `${days}d`
  return formatDateShort(iso)
}

function parse(iso: string | null | undefined): Date | null {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}
