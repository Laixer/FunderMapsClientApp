/**
 * Which documents of a melding become which rapportage (API #223, Don
 * 2026-10-08).
 *
 * A melding can carry a bestek and a bestektekening, five archive scans of one
 * drawing, a QuickScan and three phone photos. Each document becomes a
 * rapportage of its own, with its own soort, date and bureau; archive pieces
 * (one scan per page, file names starting "NL-", as the archives name them)
 * belong together and become one rapportage, merged into one PDF by the API;
 * photos nothing was taken over from stay with the melding. The reviewer can
 * regroup any of it, and let any document lapse ("vervalt"): nothing read from
 * it is taken over.
 */

/** A rapportage number (1, 2, …) or "this document lapses". */
export type GroupChoice = number | 'vervalt'

export interface GroupDoc {
  id: number
  originalFilename: string | null
  declaredCategory: string | null
  mimeType: string | null
}

/**
 * A QuickScan in a melding lapses by default: QuickScans reach the database
 * through FunderConsult, and the one inside a melding duplicates that route
 * (Don, 2026-10-08: "Ja, handig"). The reviewer can still make it a rapportage.
 */
export const QUICKSCAN_LAPSES_BY_DEFAULT = true

/** The upload adds a 16-hex hash in front of some names; it is not part of the name. */
export const bareName = (name: string | null | undefined) => (name ?? '').replace(/^[0-9a-f]{16}-/, '')

export const isArchivePiece = (d: GroupDoc) => /^NL-/i.test(bareName(d.originalFilename))

/**
 * A picture, by what the file is rather than what the melder ticked: melders
 * label PDFs "foto" too (a bestek and its tekening, dossier 6154), and those
 * are documents. An image the melder called archive research is not a photo.
 */
export const isPhoto = (d: GroupDoc) => {
  const image = d.mimeType ? d.mimeType.startsWith('image/') : /\.(jpe?g|png|heic|webp|gif|bmp|tiff?)$/i.test(d.originalFilename ?? '')
  return image && d.declaredCategory !== 'archieveresearch'
}

/** The first grouping the reviewer sees. `taken(id)` = how many values were taken over from that document. */
export function defaultGroups(docs: GroupDoc[], taken: (id: number) => number): Record<number, GroupChoice> {
  const out: Record<number, GroupChoice> = {}
  let next = 1
  let archive: number | null = null
  for (const d of docs) {
    if (isArchivePiece(d)) {
      archive ??= next++
      out[d.id] = archive
    } else if (isPhoto(d) && taken(d.id) === 0) {
      out[d.id] = 'vervalt'
    } else if (QUICKSCAN_LAPSES_BY_DEFAULT && d.declaredCategory === 'quickscan') {
      out[d.id] = 'vervalt'
    } else {
      out[d.id] = next++
    }
  }
  return out
}

/** The rapportages a choice describes, in number order, each with its documents in upload order. */
export function groupsOf(docs: GroupDoc[], choice: Record<number, GroupChoice>): { n: number; docs: GroupDoc[] }[] {
  const by = new Map<number, GroupDoc[]>()
  for (const d of docs) {
    const c = choice[d.id]
    if (typeof c !== 'number') continue
    if (!by.has(c)) by.set(c, [])
    by.get(c)!.push(d)
  }
  return [...by.entries()].sort(([a], [b]) => a - b).map(([n, ds]) => ({ n, docs: ds }))
}

/** The options for one document: every rapportage in use, one new one, and "Vervalt". */
export function groupOptions(choice: Record<number, GroupChoice>): { value: string; label: string }[] {
  const used = [...new Set(Object.values(choice).filter((c): c is number => typeof c === 'number'))].sort((a, b) => a - b)
  const next = (used[used.length - 1] ?? 0) + 1
  return [
    ...used.map((n) => ({ value: String(n), label: `Rapportage ${n}` })),
    { value: String(next), label: `Rapportage ${next} (nieuw)` },
    { value: 'vervalt', label: 'Vervalt (blijft bij de melding)' },
  ]
}
