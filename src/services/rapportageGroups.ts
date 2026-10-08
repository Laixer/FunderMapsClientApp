/**
 * Which documents of a melding become which inquiry (API #223; Don's design
 * of 2026-10-08, after testing the first version on dossier 6177).
 *
 * The reviewer first sorts the files into inquiry sets, then judges the values
 * per inquiry, then closes the dossier once: one or more inquiries, one
 * closing for the melder. Left alone, every file belongs to one inquiry. All
 * files of a set are merged into one PDF by the API, because an inquiry holds
 * one document. A file in no set ("geen inquiry") stays with the melding,
 * but nothing read from it reaches the database.
 */
/** An inquiry number (1, 2, …) or "this file goes into no inquiry". */
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

/** What the API can merge into one PDF (API merge-documents.ts MERGEABLE_MIMES). */
export const isMergeable = (d: GroupDoc) => {
  const mime = (d.mimeType ?? '').toLowerCase()
  if (mime === 'application/pdf' || mime === 'image/jpeg' || mime === 'image/png') return true
  if (mime) return false
  return /\.(pdf|jpe?g|png)$/i.test(bareName(d.originalFilename))
}

export const isQuickscan = (d: GroupDoc) => d.declaredCategory === 'quickscan'

/**
 * The first grouping the reviewer sees: everything in inquiry 1 (Don: "als de
 * gebruiker geen indeling maakt, gaan we ervan uit dat alle bestanden bij één
 * inquiry horen"), except a QuickScan and a file that cannot go into a PDF.
 */
export function defaultGroups(docs: GroupDoc[]): Record<number, GroupChoice> {
  const out: Record<number, GroupChoice> = {}
  for (const d of docs) {
    out[d.id] = (QUICKSCAN_LAPSES_BY_DEFAULT && isQuickscan(d)) || !isMergeable(d) ? 'vervalt' : 1
  }
  return out
}

/** The inquiries a choice describes, in number order, each with its documents in upload order. */
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

/** The options for one document: every inquiry in use, one new one, and "Geen inquiry". */
export function groupOptions(choice: Record<number, GroupChoice>): { value: string; label: string }[] {
  const used = [...new Set(Object.values(choice).filter((c): c is number => typeof c === 'number'))].sort((a, b) => a - b)
  const next = (used[used.length - 1] ?? 0) + 1
  return [
    ...used.map((n) => ({ value: String(n), label: `Inquiry ${n}` })),
    { value: String(next), label: `Inquiry ${next} (nieuw)` },
    { value: 'vervalt', label: 'Geen inquiry' },
  ]
}
