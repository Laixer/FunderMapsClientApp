/**
 * Several documents in one dossier: which value came from which, and which one
 * leads when two of them disagree.
 *
 * Don, 2026-10-01: reviewers could not see which document a value belongs to,
 * nor which document is leading when two say different things. The commit
 * merges every document of a dossier into one rapportage, and for one address
 * and one field the last value it meets wins (API #223) -- an accident of the
 * reviewing order, not a rule. Until the commit has a rule of its own, this
 * screen shows the conflict and what the rule would pick, and the reviewer
 * takes one value and rejects the other.
 *
 * The rule is the model's hierarchy over reports, which Don confirmed holds
 * inside a dossier too: a funderingsonderzoek of at most five years leads, then
 * a QuickScan of at most three years, then other research on site, then
 * archive research; within one rank the newest document leads. Anything the
 * rule cannot place (no type, no date, a tie) is left to the reviewer, and the
 * screen says so rather than guess.
 */

import type { IReviewArtifact, IProposedField } from '@/services/fundermaps/interfaces/IDataops'

/** Values that describe the document itself, one per document by nature: never a conflict. */
const DOCUMENT_FIELDS = new Set(['document_date', 'inquiry_type', 'contractor'])

const ON_SITE = new Set([
  'foundation_research',
  'additional_research',
  'inspectionpit',
  'second_opinion',
  'demolition_research',
  'foundation_advice',
  'soil_investigation',
  'ground_water_level_research',
  'quickscan',
  'facade_scan',
])
const ARCHIVE = new Set(['archive_research', 'architectural_research'])
const QUICKSCAN = new Set(['quickscan', 'facade_scan'])

/** The melder's label on a file, as an inquiry type: the commit's own table. */
const TYPE_FROM_CATEGORY: Record<string, string> = {
  foundationresearch: 'foundation_research',
  archieveresearch: 'archive_research',
  quickscan: 'quickscan',
  herstelbewijs: 'note',
  foto: 'note',
  overig: 'note',
}

const TYPE_LABEL: Record<string, string> = {
  foundation_research: 'funderingsonderzoek',
  additional_research: 'aanvullend onderzoek',
  inspectionpit: 'inspectieput',
  second_opinion: 'second opinion',
  demolition_research: 'sloopwaarneming',
  foundation_advice: 'funderingsadvies',
  soil_investigation: 'grondonderzoek',
  ground_water_level_research: 'grondwateronderzoek',
  quickscan: 'QuickScan',
  facade_scan: 'QuickScan',
  archive_research: 'archiefonderzoek',
  architectural_research: 'bouwhistorisch onderzoek',
  note: 'notitie',
}

/** How the reviewer has judged a value so far: what it now says, or null when it no longer counts. */
export type Judged = (f: IProposedField) => string | null

export interface DocumentProfile {
  artifactId: number
  name: string
  type: string | null
  date: Date | null
}

export interface Conflict {
  /** The other documents' values for the same address and field. */
  others: { artifactId: number; name: string; value: string }[]
  /** The document the rule puts first, or null when the rule cannot decide. */
  leading: DocumentProfile | null
}

/** The name a reviewer recognises: the file name, else its tab number. */
export function documentName(artifacts: IReviewArtifact[], artifactId: number): string {
  const i = artifacts.findIndex((a) => a.id === artifactId)
  if (i < 0) return 'onbekend document'
  return artifacts[i]!.originalFilename ?? `Document ${i + 1}`
}

/** What each document says about itself, as judged so far. */
export function documentProfiles(
  artifacts: IReviewArtifact[],
  fields: IProposedField[],
  judged: Judged,
): Map<number, DocumentProfile> {
  // Without a judged type the commit falls back to the melder's label on the
  // file (dataops-commit.ts TYPE_FROM_CATEGORY); the rule does the same.
  const out = new Map<number, DocumentProfile>(
    artifacts.map((a) => [
      a.id,
      {
        artifactId: a.id,
        name: documentName(artifacts, a.id),
        type: TYPE_FROM_CATEGORY[a.declaredCategory ?? ''] ?? null,
        date: null,
      },
    ]),
  )
  for (const f of fields) {
    const p = out.get(f.artifactId)
    const value = judged(f)
    if (!p || value == null) continue
    if (f.field === 'inquiry_type') p.type = value
    if (f.field === 'document_date') {
      const d = new Date(value)
      if (!Number.isNaN(d.getTime())) p.date = d
    }
  }
  return out
}

const yearsAgo = (d: Date, now: Date) => (now.getTime() - d.getTime()) / (365.25 * 24 * 3600 * 1000)

/** Lower leads. Null: the rule has nothing to go on. */
function rank(p: DocumentProfile, now: Date): number | null {
  if (!p.type) return null
  const age = p.date ? yearsAgo(p.date, now) : null
  if (p.type === 'foundation_research' && age != null && age <= 5) return 0
  if (QUICKSCAN.has(p.type) && age != null && age <= 3) return 1
  if (ON_SITE.has(p.type)) return 2
  if (ARCHIVE.has(p.type)) return 3
  return null
}

/** The document the hierarchy puts first among these, or null when it cannot tell. */
export function leadingDocument(profiles: DocumentProfile[], now = new Date()): DocumentProfile | null {
  const ranked = profiles.map((p) => ({ p, r: rank(p, now) }))
  if (ranked.some((x) => x.r == null)) return null
  const best = Math.min(...ranked.map((x) => x.r!))
  const top = ranked.filter((x) => x.r === best).map((x) => x.p)
  if (top.length === 1) return top[0]!
  if (top.some((p) => !p.date)) return null
  const sorted = [...top].sort((a, b) => b.date!.getTime() - a.date!.getTime())
  return sorted[0]!.date!.getTime() === sorted[1]!.date!.getTime() ? null : sorted[0]!
}

/** "funderingsonderzoek, 12-03-2021" -- what the rule looked at. */
export function describeDocument(p: DocumentProfile): string {
  const type = p.type ? (TYPE_LABEL[p.type] ?? p.type) : 'soort onbekend'
  const date = p.date ? p.date.toLocaleDateString('nl-NL') : 'datum onbekend'
  return `${type}, ${date}`
}

/**
 * Per value: the conflict it is part of, if any. Two documents conflict on an
 * address and field when both still carry a value there and the values differ.
 * Rejected and superseded values do not count; a correction counts as its new value.
 */
export function findConflicts(
  artifacts: IReviewArtifact[],
  fields: IProposedField[],
  judged: Judged,
  now = new Date(),
): Map<number, Conflict> {
  if (artifacts.length < 2) return new Map()
  const profiles = documentProfiles(artifacts, fields, judged)
  const byKey = new Map<string, { f: IProposedField; value: string }[]>()
  for (const f of fields) {
    if (DOCUMENT_FIELDS.has(f.field)) continue
    const value = judged(f)
    if (value == null || value.trim() === '') continue
    const key = `${f.addressId ?? f.addressText ?? ''}|${f.field}`
    byKey.set(key, [...(byKey.get(key) ?? []), { f, value: value.trim() }])
  }

  const out = new Map<number, Conflict>()
  for (const rows of byKey.values()) {
    const docs = new Set(rows.map((r) => r.f.artifactId))
    const values = new Set(rows.map((r) => r.value.toLowerCase()))
    if (docs.size < 2 || values.size < 2) continue
    const leading = leadingDocument([...docs].map((id) => profiles.get(id)!).filter(Boolean), now)
    for (const r of rows) {
      out.set(r.f.id, {
        others: rows
          .filter((o) => o.f.artifactId !== r.f.artifactId && o.value.toLowerCase() !== r.value.toLowerCase())
          .map((o) => ({ artifactId: o.f.artifactId, name: documentName(artifacts, o.f.artifactId), value: o.value })),
        leading,
      })
    }
  }
  return out
}
