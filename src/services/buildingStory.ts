/**
 * The Pand page (2026-10-22): one pand's whole story, from the API's
 * GET /dataops/building/:id, turned into what the page shows — the model's
 * labels now, one list of events newest first, and the lanes of the
 * "levenslijn" above it.
 *
 * Codes stay English (the API sends them as Postgres has them); everything a
 * person reads is Dutch, in the words the rest of the Studio and the customer
 * map already use (VALUE_LABEL for the review's values, the map's
 * Indicatief / Vastgesteld / Afgeleid, the Datastroom's source names).
 */
import type { RouteLocationRaw } from 'vue-router'

import type { IBuildingStory } from '@/services/fundermaps/interfaces/IDataops'
import { AUDIT_STATUS, statusMeta, type StatusMeta } from '@/services/inquiryEnums'
import { OUTCOME_LABEL, VALUE_LABEL } from '@/services/reviewLabels'
import { sourceLabel } from '@/services/dataflow'
import type { Tone } from '@/services/tone'
import { formatDate } from '@/utils/date'

export type Story = IBuildingStory
type Rapportage = Story['rapportages'][number]

/* ------------------------------------------------------------------ labels */

/** The customer map's words for how sure the model is (WebFront EReliability). */
export const RELIABILITY_LABEL: Record<string, string> = {
  indicative: 'indicatief',
  established: 'vastgesteld',
  cluster: 'afgeleid',
  supercluster: 'afgeleid',
}

export const BUILDING_TYPE_LABEL: Record<string, string> = {
  house: 'woning',
  shed: 'bijgebouw',
  houseboat: 'woonboot',
  mobile_home: 'woonwagen',
}

/** recoveryEnums.ts has these by number; the API sends the code. Same words, matched by name. */
export const RECOVERY_TYPE_LABEL: Record<string, string> = {
  table: 'tafelconstructie',
  beam_on_pile: 'balk op paal',
  pile_lowering: 'paalverlaging',
  pile_in_wall: 'paal in wand',
  injection: 'injectie',
  unknown: 'onbekend',
}
export const RECOVERY_STATUS_LABEL: Record<string, string> = { planned: 'gepland', requested: 'aangevraagd', executed: 'uitgevoerd' }
export const RECOVERY_DOCUMENT_LABEL: Record<string, string> = {
  permit: 'Vergunning',
  foundation_report: 'Funderingsrapport',
  archive_report: 'Archiefrapport',
  owner_evidence: 'Eigenaarsbewijs',
  unknown: 'Herstel',
}
export const QUESTION_TYPE_LABEL: Record<string, string> = {
  buy_sell: 'koop of verkoop',
  registration: 'registratie',
  legal: 'juridisch',
  financial: 'financieel',
  guidance: 'begeleiding',
  recovery: 'herstel',
  research: 'onderzoek',
  other: 'overig',
}

const AUDIT_BY_CODE: Record<string, number> = {
  todo: AUDIT_STATUS.TODO,
  pending: AUDIT_STATUS.PENDING,
  done: AUDIT_STATUS.DONE,
  discarded: AUDIT_STATUS.DISCARDED,
  pending_review: AUDIT_STATUS.PENDING_REVIEW,
  rejected: AUDIT_STATUS.REJECTED,
}
/** A rapportage's or herstel's status, by its code, in the Studio's own words and colour. */
export const auditMeta = (code: string | null | undefined): StatusMeta => statusMeta(AUDIT_BY_CODE[code ?? ''])

/** A review value in Dutch (foundation type, quality, damage cause, …), or the code when unknown. */
export const valueLabel = (field: string, code: string | null | undefined) =>
  code == null ? null : (VALUE_LABEL[field]?.[code] ?? code)

const sentence = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export const addressLine = (a: { street: string; number: string; city?: string }) =>
  [`${a.street} ${a.number}`.trim(), a.city].filter(Boolean).join(', ')

/** The page's name for the pand: its first address, or the BAG number when it has none. */
export function pandTitle(story: Story): string {
  const a = story.addresses[0]
  if (!a) return `Pand ${bagNumber(story.id)}`
  return story.addressCount > 1 ? `${a.street} ${a.number} e.a.` : `${a.street} ${a.number}`
}
/** The sixteen digits people type and read; the prefix is the same for every pand. */
export const bagNumber = (id: string) => id.replace(/^NL\.IMBAG\.PAND\./i, '')

/* ------------------------------------------------------------- the model */

/** The four risks, as the map and the Modellen page name them. */
export const MODEL_RISKS = [
  { key: 'drystandRisk', reliability: 'drystandRiskReliability', label: 'Droogstand' },
  { key: 'dewateringDepthRisk', reliability: 'dewateringDepthRiskReliability', label: 'Ontwateringsdiepte' },
  { key: 'bioInfectionRisk', reliability: 'bioInfectionRiskReliability', label: 'Bacteriële aantasting' },
  { key: 'unclassifiedRisk', reliability: null, label: 'Vastgesteld risico' },
] as const

/** The map's own colours, so a class looks here as it does on the map and on Modellen. */
export const RISK_BG: Record<string, string> = {
  a: 'bg-risk-10',
  b: 'bg-risk-20',
  c: 'bg-risk-30',
  d: 'bg-risk-40',
  e: 'bg-risk-50',
}

/* ------------------------------------------------------------ the events */

export type EventKind = 'built' | 'rapportage' | 'recovery' | 'dossier' | 'incident' | 'model'

export interface StoryEvent {
  key: string
  kind: EventKind
  /** ISO timestamp or YYYY-MM-DD; for `built` the first of January of the year. */
  date: string
  title: string
  /** Short facts after the title, joined with " · ". */
  meta: string[]
  tone: Tone
  pill?: { label: string; tone: Tone }
  to?: RouteLocationRaw
  /** The rapportage the model's label rests on now. */
  current?: boolean
  /** Model recalculations: what moved, in the map's letters. */
  changes?: { label: string; before: string | null; after: string | null }[]
  /**
   * A dossier that came and went without adding anything (closed as "geen
   * gegevens" or as a duplicate): true to the history, but the page folds
   * several of them into one line (2026-10-22: on a real pand they were half
   * the list, each named by its file).
   */
  quiet?: boolean
}

function rapportageEvent(r: Rapportage, currentId: number | null): StoryEvent {
  const status = auditMeta(r.auditStatus)
  const facts = [
    valueLabel('foundation_type', r.foundationType),
    r.overallQuality ? `kwaliteit ${valueLabel('foundation_quality', r.overallQuality)}` : null,
    r.damageCause ? `schade door ${valueLabel('damage_cause', r.damageCause)}` : null,
    r.recoveryAdvised ? 'herstel geadviseerd' : null,
  ].filter((s): s is string => !!s)
  return {
    key: `r${r.id}`,
    kind: 'rapportage',
    date: r.documentDate ?? r.createdAt,
    title: `${sentence(valueLabel('inquiry_type', r.type) ?? 'Rapportage')} #${r.id}`,
    meta: [...(r.contractor ? [r.contractor] : []), ...facts],
    tone: status.tone === 'green' ? 'green' : 'neutral',
    pill: { label: status.label, tone: status.tone },
    to: { name: 'inquiry-view', params: { id: r.id } },
    current: r.id === currentId,
  }
}

/**
 * Everything that happened to the pand, newest first; the year it was built
 * closes the list. A dossier says where it came in and where it ended; a model
 * recalculation says what moved.
 */
export function storyEvents(story: Story): StoryEvent[] {
  const current = story.model?.inquiryId ?? null
  const events: StoryEvent[] = story.rapportages.map((r) => rapportageEvent(r, current))

  for (const r of story.recoveries) {
    const status = r.status ? RECOVERY_STATUS_LABEL[r.status] : null
    events.push({
      key: `h${r.id}`,
      kind: 'recovery',
      date: r.recoveryDate ?? r.documentDate ?? r.createdAt,
      title: `Herstel #${r.id}`,
      meta: [
        RECOVERY_DOCUMENT_LABEL[r.documentType] ?? r.documentType,
        ...(r.recoveryType ? [RECOVERY_TYPE_LABEL[r.recoveryType] ?? r.recoveryType] : []),
        ...(r.contractor ? [r.contractor] : []),
      ],
      tone: r.status === 'executed' ? 'green' : 'neutral',
      pill: status ? { label: status, tone: r.status === 'executed' ? 'green' : r.status === 'planned' ? 'amber' : 'neutral' } : undefined,
      to: { name: 'recovery-view', params: { id: r.id } },
    })
  }

  for (const d of story.dossiers) {
    const open = !d.outcome && !d.inquiryId
    const pill = d.inquiryId
      ? { label: `in FunderMaps · #${d.inquiryId}`, tone: 'green' as Tone }
      : open
        ? { label: 'open', tone: 'amber' as Tone }
        : { label: OUTCOME_LABEL[d.outcome ?? ''] ?? d.outcome ?? 'gesloten', tone: (d.outcome === 'rejected' ? 'red' : 'neutral') as Tone }
    events.push({
      key: `d${d.id}`,
      kind: 'dossier',
      date: d.receivedAt,
      title: d.subject || 'Dossier zonder onderwerp',
      meta: [sourceLabel(d.channel), ...(d.reference ? [d.reference] : []), ...(d.auditInquiryId ? [`nalezing van #${d.auditInquiryId}`] : [])],
      tone: d.inquiryId ? 'green' : open ? 'amber' : 'neutral',
      pill,
      to: { name: 'review-dossier', params: { id: d.id } },
      quiet: !d.inquiryId && (d.outcome === 'no_data' || d.outcome === 'duplicate'),
    })
  }

  for (const i of story.incidents) {
    events.push({
      key: `i${i.id}`,
      kind: 'incident',
      date: i.createdAt,
      title: 'Melding (voor de dossiers)',
      meta: [i.questionType ? `vraag: ${QUESTION_TYPE_LABEL[i.questionType] ?? i.questionType}` : null, i.damageCause ? `schade door ${valueLabel('damage_cause', i.damageCause)}` : null].filter(
        (s): s is string => !!s,
      ),
      tone: 'neutral',
    })
  }

  for (const [n, c] of story.modelChanges.entries()) {
    events.push({
      key: `m${n}`,
      kind: 'model',
      date: c.at,
      title: 'Het model rekende opnieuw',
      meta: c.address ? [c.address] : [],
      tone: 'blue',
      changes: c.fields,
      to: { name: 'review-dossier', params: { id: c.dossierId } },
    })
  }

  events.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  const built = story.building?.builtYear
  if (built) events.push({ key: 'built', kind: 'built', date: `${built}-01-01`, title: `Gebouwd in ${built}`, meta: [], tone: 'neutral' })
  return events
}

/* ------------------------------------------------------------- the lanes */

/** The levenslijn's rows, top to bottom; old meldingen ride with the dossiers. */
export const LANES: { kinds: EventKind[]; label: string }[] = [
  { kinds: ['rapportage'], label: 'Rapportages' },
  { kinds: ['recovery'], label: 'Herstel' },
  { kinds: ['dossier', 'incident'], label: 'Dossiers' },
  { kinds: ['model'], label: 'Model' },
]

/** A date as a fractional year, for the levenslijn's x axis. */
export function yearOf(date: string): number {
  const d = new Date(date.length === 10 ? `${date}T12:00:00Z` : date)
  const start = Date.UTC(d.getUTCFullYear(), 0, 1)
  const end = Date.UTC(d.getUTCFullYear() + 1, 0, 1)
  return d.getUTCFullYear() + (d.getTime() - start) / (end - start)
}

/**
 * The span the levenslijn draws: from the first event (not the build year —
 * a pand from 1908 with all its paperwork after 2015 would be one dot at the
 * right) to today, at least five years wide, on whole years.
 */
export function lifelineSpan(events: StoryEvent[], now = new Date()): [number, number] {
  const end = yearOf(now.toISOString())
  const years = events.filter((e) => e.kind !== 'built').map((e) => yearOf(e.date))
  const first = years.length ? Math.min(...years) : end - 5
  const start = Math.floor(Math.min(first, end - 5))
  return [start, Math.ceil(end)]
}

/** "12 mrt 2019"; a bare year for the build year. */
export const eventDate = (e: StoryEvent) => (e.kind === 'built' ? e.date.slice(0, 4) : formatDate(e.date))

/* ------------------------------------------------------------ the verdict */

const yearOfDate = (date: string | null | undefined) => (date ? date.slice(0, 4) : null)
/** A label inside a sentence: "Funderingsonderzoek" → "funderingsonderzoek"; a name like "QuickScan" stays. */
const inSentence = (label: string) => (/[A-Z]/.test(label.slice(1)) ? label : label.charAt(0).toLowerCase() + label.slice(1))

/**
 * The page's verdict in plain words (2026-10-22, the Pand page as the hub):
 * what the foundation is and how sure that is, whether it was repaired, and
 * whether work is open — "Houten fundering, vastgesteld met een
 * funderingsonderzoek uit 2019 · hersteld in 2021 · 2 dossiers open".
 */
export function verdict(story: Story): string[] {
  const parts: string[] = []
  const m = story.model
  if (m?.foundationType) {
    const type = sentence(valueLabel('foundation_type', m.foundationType) ?? m.foundationType)
    const basis = m.inquiryId ? story.rapportages.find((r) => r.id === m.inquiryId) : null
    const how =
      m.foundationTypeReliability === 'established'
        ? basis
          ? `vastgesteld met ${inSentence(valueLabel('inquiry_type', basis.type) ?? 'een rapportage')} uit ${yearOfDate(basis.documentDate ?? basis.createdAt)}`
          : 'vastgesteld'
        : m.foundationTypeReliability === 'indicative'
          ? 'geschat door het model'
          : m.foundationTypeReliability
            ? 'afgeleid uit vergelijkbare panden'
            : null
    parts.push(how ? `${type}, ${how}` : type)
  } else {
    parts.push('Het model heeft voor dit pand geen funderingstype')
  }
  const done = story.recoveries.filter((r) => r.status === 'executed')
  const planned = story.recoveries.filter((r) => r.status === 'planned' || r.status === 'requested')
  if (done.length) {
    const years = done.map((r) => yearOfDate(r.recoveryDate ?? r.documentDate)).filter(Boolean).sort()
    const year = years[years.length - 1]
    parts.push(year ? `hersteld in ${year}` : 'hersteld')
  } else if (planned.length) {
    parts.push('herstel aangevraagd')
  }
  const open = story.dossiers.filter((d) => !d.outcome && !d.inquiryId).length
  parts.push(open ? `${open} ${open === 1 ? 'dossier' : 'dossiers'} open` : 'geen open werk')
  return parts
}
