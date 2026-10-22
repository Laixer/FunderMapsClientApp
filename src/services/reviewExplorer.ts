/**
 * The review queue's question, as one object.
 *
 * The same idea as `explorer.ts` for Rapportages, on the dossier's own
 * dimensions: every filter, the sort and the page live in a single
 * `ReviewQuery` that serialises to the URL and back, so a view is a link and
 * "which 41 dossiers are you looking at?" is answered by the address bar.
 *
 * Kept as its own module rather than generalising `explorer.ts`: the two
 * queries share a shape, not a vocabulary. A dossier has no status, no
 * creator and no reviewer; it has a channel, a read state, an age and the kind
 * of document the pipeline thinks it is.
 */

import type { LocationQueryRaw } from 'vue-router'

import type {
  IQueueListOpts,
  QueueChannel,
  QueueOutcome,
  QueueSort,
  QueueState,
} from '@/services/fundermaps/endpoints/dataops'
import { PAGE_SIZE } from '@/services/explorer'
import { INQUIRY_TYPE_CODE_LABELS } from '@/services/inquiryEnums'

export interface ReviewQuery {
  q: string
  /** Combined as OR by the API. */
  channel: QueueChannel[]
  /** unread · empty · proposals; combined as OR by the API. */
  state: QueueState[]
  /** Received more than a week ago. */
  overdue: boolean
  building: 'resolved' | 'unresolved' | null
  /** `report.inquiry_type` codes as the pipeline read them; combined as OR. */
  kind: string[]
  /**
   * Closed dossiers with these outcomes instead of the desk. Empty = the
   * desk. A rejected report used to be gone the moment it was closed; the
   * fixed tabs Afgewezen and Duplicaten are this field (ClientApp #333, 11).
   */
  outcome: QueueOutcome[]
  /** Only the dossiers handed to me (API #222). */
  mine: boolean
  /** Always set — see `DEFAULT_SORT`. There is no "unsorted". */
  sort: QueueSort
  order: 'asc' | 'desc'
  /** 1-based. */
  page: number
}

/**
 * Oldest first, always, unless somebody says otherwise: a terugmelding
 * carries a 24–48 hour promise to whoever sent it, so the queue is a waiting
 * line, not a feed. Every ordering ends on the primary key server-side, which
 * is what makes paging through it total.
 */
export const DEFAULT_SORT: QueueSort = 'received_at'
export const DEFAULT_ORDER: 'asc' | 'desc' = 'asc'

export function isDefaultSort(query: ReviewQuery): boolean {
  return query.sort === DEFAULT_SORT && query.order === DEFAULT_ORDER
}

export function emptyQuery(): ReviewQuery {
  return {
    q: '',
    channel: [],
    state: [],
    overdue: false,
    building: null,
    kind: [],
    outcome: [],
    mine: false,
    sort: DEFAULT_SORT,
    order: DEFAULT_ORDER,
    page: 1,
  }
}

/* --------------------------------------------------------------- vocabulary */

export const CHANNEL_OPTIONS: readonly { value: QueueChannel; label: string }[] = [
  { value: 'upload', label: 'Portaal' },
  { value: 'invoer_app', label: 'Studio' },
  { value: 'email', label: 'E-mail' },
  { value: 'bulk_drop', label: 'Bulk' },
  { value: 'api', label: 'API' },
  { value: 'audit', label: 'Nalezing' },
]

export const STATE_OPTIONS: readonly { value: QueueState; label: string }[] = [
  { value: 'proposals', label: 'Met voorstellen' },
  { value: 'empty', label: 'Niets gevonden' },
  { value: 'replied', label: 'Reactie ontvangen' },
  { value: 'question', label: 'Vraag zonder document' },
]

export const BUILDING_OPTIONS: readonly { value: 'resolved' | 'unresolved'; label: string }[] = [
  { value: 'resolved', label: 'Pand herkend' },
  { value: 'unresolved', label: 'Pand niet herkend' },
]

export const OUTCOME_OPTIONS: readonly { value: QueueOutcome; label: string }[] = [
  { value: 'rejected', label: 'Afgewezen' },
  { value: 'duplicate', label: 'Duplicaat' },
  { value: 'no_data', label: 'Geen gegevens' },
  { value: 'accepted', label: 'Afgehandeld' },
]

/** The kinds the pipeline can read, in the order a reviewer wants to pick from. */
export const KIND_OPTIONS: readonly { value: string; label: string }[] = Object.entries(
  INQUIRY_TYPE_CODE_LABELS,
).map(([value, label]) => ({ value, label }))

const CHANNELS = new Set(CHANNEL_OPTIONS.map((o) => o.value))
const STATES = new Set(STATE_OPTIONS.map((o) => o.value))
const KINDS = new Set(KIND_OPTIONS.map((o) => o.value))
const OUTCOMES = new Set(OUTCOME_OPTIONS.map((o) => o.value))

/**
 * A label inside a sentence or a chip: its first letter in lower case, but a
 * name keeps its capitals. Lower-casing the whole label gave "via api of
 * studio" and "soort quickscan (addendum)".
 */
const NAMES = /^(API|Studio|QuickScan|FunderMaps)(?![a-z])/
export const inSentence = (label: string) =>
  NAMES.test(label) ? label : label.charAt(0).toLowerCase() + label.slice(1)

export const channelLabel = (value: string) =>
  CHANNEL_OPTIONS.find((o) => o.value === value)?.label ?? value
export const kindLabel = (value: string) => INQUIRY_TYPE_CODE_LABELS[value] ?? value
export const outcomeLabel = (value: string) =>
  OUTCOME_OPTIONS.find((o) => o.value === value)?.label ?? value

/* -------------------------------------------------------------- sort fields */

export interface SortOption {
  value: QueueSort
  label: string
  asc: string
  desc: string
}

export const SORT_OPTIONS: readonly SortOption[] = [
  { value: 'received_at', label: 'Ontvangen', asc: 'oudste eerst', desc: 'nieuwste eerst' },
  { value: 'outcome_at', label: 'Gesloten', asc: 'oudste eerst', desc: 'nieuwste eerst' },
  { value: 'open', label: 'Voorstellen', asc: 'minste eerst', desc: 'meeste eerst' },
  { value: 'files', label: 'Bestanden', asc: 'minste eerst', desc: 'meeste eerst' },
  { value: 'subject', label: 'Document', asc: 'A → Z', desc: 'Z → A' },
  { value: 'id', label: 'ID', asc: 'laagste eerst', desc: 'hoogste eerst' },
]

const SORT_FIELDS: readonly QueueSort[] = SORT_OPTIONS.map((o) => o.value)

export function sortOption(field: QueueSort): SortOption {
  return SORT_OPTIONS.find((o) => o.value === field) ?? SORT_OPTIONS[0]
}

export function describeSort(sort: QueueSort, order: 'asc' | 'desc'): string {
  const option = sortOption(sort)
  return `${option.label.toLowerCase()} · ${order === 'asc' ? option.asc : option.desc}`
}

/* ---------------------------------------------------------------- URL state */

function strings<T extends string>(raw: unknown, valid: (s: string) => boolean): T[] {
  if (typeof raw !== 'string') return []
  const out: T[] = []
  for (const part of raw.split(',')) {
    const value = part.trim()
    if (!value || !valid(value) || out.includes(value as T)) continue
    out.push(value as T)
  }
  return out
}

export function parseQuery(raw: Record<string, unknown>): ReviewQuery {
  const page = Number(raw.page)
  const sort = SORT_FIELDS.find((f) => f === raw.sort) ?? DEFAULT_SORT
  return {
    q: typeof raw.q === 'string' ? raw.q : '',
    channel: strings<QueueChannel>(raw.channel, (s) => CHANNELS.has(s as QueueChannel)),
    state: strings<QueueState>(raw.state, (s) => STATES.has(s as QueueState)),
    overdue: raw.age === 'overdue',
    building: raw.building === 'resolved' || raw.building === 'unresolved' ? raw.building : null,
    kind: strings(raw.kind, (s) => KINDS.has(s)),
    outcome: strings<QueueOutcome>(raw.outcome, (s) => OUTCOMES.has(s as QueueOutcome)),
    mine: raw.assignedTo === 'me',
    sort,
    // The default direction depends on the column: oldest first on the
    // received date, most first on a count. Absent means that default.
    order:
      raw.order === 'asc' || raw.order === 'desc'
        ? raw.order
        : sort === DEFAULT_SORT
          ? DEFAULT_ORDER
          : 'desc',
    page: Number.isInteger(page) && page > 0 ? page : 1,
  }
}

/**
 * Only what differs from the default reaches the URL, except the tab: every
 * link names it. A link without one dates from before the groups (2026-10-22),
 * when no `view` meant Alles, and still opens there (`routeViewKey`).
 */
export function toRouteQuery(query: ReviewQuery, viewKey: string): LocationQueryRaw {
  const out: LocationQueryRaw = { view: viewKey }
  if (query.q) out.q = query.q
  if (query.channel.length) out.channel = query.channel.join(',')
  if (query.state.length) out.state = query.state.join(',')
  if (query.overdue) out.age = 'overdue'
  if (query.building) out.building = query.building
  if (query.kind.length) out.kind = query.kind.join(',')
  if (query.outcome.length) out.outcome = query.outcome.join(',')
  if (query.mine) out.assignedTo = 'me'
  if (!isDefaultSort(query)) {
    out.sort = query.sort
    out.order = query.order
  }
  if (query.page > 1) out.page = String(query.page)
  return out
}

/* -------------------------------------------------------------- API mapping */

/**
 * A search typed on "Alles" looks at every dossier, closed ones too (API
 * #191; Don, 2026-09-19: "je zou dat ook verwachten te vinden onder Alles").
 * A named view keeps its own scope, and so does a closed tab: its outcome
 * filter already says which dossiers it means.
 */
export const isWideSearch = (query: ReviewQuery, viewKey: string | undefined): boolean =>
  viewKey === 'alles' && query.q.trim() !== '' && query.outcome.length === 0

export function toQueueOpts(query: ReviewQuery, viewKey?: string): IQueueListOpts {
  const opts: IQueueListOpts = {
    limit: PAGE_SIZE,
    offset: (query.page - 1) * PAGE_SIZE,
    sort: query.sort,
    order: query.order,
  }
  if (query.q.trim()) opts.q = query.q.trim()
  if (query.channel.length) opts.channel = [...query.channel]
  if (query.state.length) opts.state = [...query.state]
  if (query.overdue) opts.age = 'overdue'
  if (query.building) opts.building = query.building
  if (query.kind.length) opts.kind = [...query.kind]
  if (query.outcome.length) opts.outcome = [...query.outcome]
  if (query.mine) opts.assignedTo = 'me'
  if (isWideSearch(query, viewKey)) opts.scope = 'all'
  return opts
}

/** The same question for `queueCount`: no page, no order. */
export function toCountOpts(query: ReviewQuery, viewKey?: string): IQueueListOpts {
  const opts = toQueueOpts(query, viewKey)
  delete opts.limit
  delete opts.offset
  delete opts.sort
  delete opts.order
  return opts
}

/* ------------------------------------------------------------- filter chips */

export interface Chip {
  id: string
  label: string
  value: string
  clear: (query: ReviewQuery) => ReviewQuery
}

/** One removable chip per active filter, plus one for a non-default sort. */
export function chipsFor(query: ReviewQuery): Chip[] {
  const chips: Chip[] = []
  const labels = <T extends string>(values: T[], f: (v: T) => string) =>
    values.map((v) => inSentence(f(v))).join(' of ')

  if (query.state.length) {
    chips.push({
      id: 'state',
      label: 'stand',
      value: labels(query.state, (v) => STATE_OPTIONS.find((o) => o.value === v)?.label ?? v),
      clear: (q) => ({ ...q, state: [], page: 1 }),
    })
  }
  if (query.channel.length) {
    // Alles asks for five channels of six: "portaal of Studio of e-mail of API
    // of nalezing" said less than what it leaves out.
    const missing = CHANNEL_OPTIONS.filter((o) => !query.channel.includes(o.value))
    chips.push({
      id: 'channel',
      label: 'via',
      value:
        missing.length === 1 && query.channel.length > 1
          ? `alles behalve ${inSentence(missing[0].label)}`
          : labels(query.channel, channelLabel),
      clear: (q) => ({ ...q, channel: [], page: 1 }),
    })
  }
  if (query.overdue) {
    chips.push({
      id: 'age',
      label: 'leeftijd',
      value: 'langer dan een week open',
      clear: (q) => ({ ...q, overdue: false, page: 1 }),
    })
  }
  if (query.building) {
    chips.push({
      id: 'building',
      label: 'pand',
      value: query.building === 'resolved' ? 'herkend' : 'niet herkend',
      clear: (q) => ({ ...q, building: null, page: 1 }),
    })
  }
  if (query.kind.length) {
    chips.push({
      id: 'kind',
      label: 'soort',
      value: labels(query.kind, kindLabel),
      clear: (q) => ({ ...q, kind: [], page: 1 }),
    })
  }
  if (query.mine) {
    chips.push({ id: 'mine', label: 'toegewezen', value: 'aan mij', clear: (q) => ({ ...q, mine: false, page: 1 }) })
  }
  if (query.outcome.length) {
    chips.push({
      id: 'outcome',
      label: 'gesloten',
      value: labels(query.outcome, outcomeLabel),
      clear: (q) => ({ ...q, outcome: [], page: 1 }),
    })
  }
  if (!isDefaultSort(query)) {
    chips.push({
      id: 'sort',
      label: 'sortering',
      value: describeSort(query.sort, query.order),
      clear: (q) => ({ ...q, sort: DEFAULT_SORT, order: DEFAULT_ORDER, page: 1 }),
    })
  }
  return chips
}

/* ------------------------------------------------------------- saved views */

export interface SavedView {
  key: string
  label: string
  query: Partial<ReviewQuery>
  builtin: boolean
}

/**
 * Every channel but the archive drop. That drop is the loket's archive export,
 * kept open on purpose: on 2026-10-22 it was 664 of the 1,054 open dossiers,
 * and listed oldest first it buried the 34 melders waiting for an answer.
 * It has its own tab, Archiefverwerking.
 */
const WITHOUT_DROP: QueueChannel[] = CHANNEL_OPTIONS.map((o) => o.value).filter(
  (c) => c !== 'bulk_drop',
)

/** The questions a reviewer arrives with, in the order of their groups (`viewGroups`). */
export const BUILTIN_VIEWS: readonly SavedView[] = [
  // Te beantwoorden. The melders waiting on us, longest waiting first: the
  // tab Controle opens on, and the number beside it in the sidebar.
  { key: 'beantwoorden', label: 'Wachtrij', query: { channel: ['upload'] }, builtin: true },
  // What came in through melden.fundermaps.com, newest first (Don, 2026-09-15).
  { key: 'meldingen', label: 'Meldingen', query: { channel: ['upload'], sort: 'received_at', order: 'desc' }, builtin: true },
  // No document at all: the melder asked something; the answer-only screen handles these (Don, 2026-09-17).
  { key: 'vragen', label: 'Vragen', query: { channel: ['upload'], state: ['question'], sort: 'received_at', order: 'desc' }, builtin: true },
  // The melder had the last word, open or closed; spans both (API state=replied).
  { key: 'reacties', label: 'Reactie ontvangen', query: { state: ['replied'] }, builtin: true },
  // Handed to me by a colleague (API #222): the decisions waiting on me.
  { key: 'mij', label: 'Aan mij toegewezen', query: { mine: true }, builtin: true },
  // Te verwerken: documents still to be entered.
  // "Nog niet gelezen" and "Te lang open" were views here until 2026-09-22.
  // Don: "Dit zijn geen relevante werkfilters maar statussen." Nobody arrives
  // at the queue asking for them; a row still shows "te lang open" as a pill,
  // which is where a status belongs. The API keeps state=unread and age=overdue.
  { key: 'studio', label: 'Studio-uploads', query: { channel: ['invoer_app'] }, builtin: true },
  { key: 'nalezing', label: 'Nalezingen', query: { channel: ['audit'] }, builtin: true },
  // Fundie's archive leads: the "Archiefwijzer:" and "Archief zoeken:" work packages.
  { key: 'archiefwijzer', label: 'Archiefwijzer', query: { channel: ['api'] }, builtin: true },
  {
    key: 'archiefverwerking',
    label: 'Archiefverwerking',
    query: { channel: ['bulk_drop'] },
    builtin: true,
  },
  // Open dossiers the pipeline read nothing from; nearly all of them (79 of 84
  // on 2026-10-22) from the archive drop. Still on the desk, so not under Afgerond.
  { key: 'niets', label: 'Niets gevonden', query: { state: ['empty'] }, builtin: true },
  // Afgerond: closed, not the desk.
  // Closed and dealt with, newest closing first: "where did that melding go
  // that I just answered?" (Don, 2026-09-18, after losing FM2026-000140).
  // Afgewezen and Duplicaten have their own tabs, so this one keeps the two
  // outcomes that mean the melding was handled on its merits.
  {
    key: 'afgehandeld',
    label: 'Afgehandeld',
    query: { outcome: ['accepted', 'no_data'], sort: 'outcome_at', order: 'desc' },
    builtin: true,
  },
  // Newest closing first, because the question here is "what did we throw out
  // yesterday, and was that right?".
  {
    key: 'afgewezen',
    label: 'Afgewezen',
    query: { outcome: ['rejected'], sort: 'outcome_at', order: 'desc' },
    builtin: true,
  },
  {
    key: 'duplicaten',
    label: 'Duplicaten',
    query: { outcome: ['duplicate'], sort: 'outcome_at', order: 'desc' },
    builtin: true,
  },
  // The whole desk was the first tab and the default until 2026-10-22. It stays,
  // last, and still finds closed dossiers too when searched (`isWideSearch`).
  { key: 'alles', label: 'Alles', query: { channel: WITHOUT_DROP }, builtin: true },
]

/** The tab Controle opens on, and whose count the sidebar shows. */
export const DEFAULT_VIEW = 'beantwoorden'

export const defaultView = (): SavedView => BUILTIN_VIEWS.find((v) => v.key === DEFAULT_VIEW)!

/**
 * The views in groups, named after what we do with a dossier: answer a
 * melder, enter a document, or nothing any more. The sidebar lists them under
 * Controle, each with its count, like an inbox's folders (2026-10-22):
 * fourteen tabs with their counts did not fit one row of a 1528px window.
 */
export interface ViewGroup {
  key: string
  label: string
  /** One line under the page title: what is in it. */
  hint: string
  views: readonly string[]
  /** The group is its one view (Alles): listed without a heading. */
  single?: boolean
}

const WORK_GROUPS: readonly ViewGroup[] = [
  {
    key: 'beantwoorden',
    label: 'Te beantwoorden',
    hint: 'Een melder wacht op ons antwoord.',
    views: ['beantwoorden', 'meldingen', 'vragen', 'reacties', 'mij'],
  },
  {
    key: 'verwerken',
    label: 'Te verwerken',
    hint: 'Documenten die nog ingevoerd moeten worden.',
    views: ['studio', 'nalezing', 'archiefwijzer', 'archiefverwerking', 'niets'],
  },
  {
    key: 'afgerond',
    label: 'Afgerond',
    hint: 'Gesloten dossiers, het laatst gesloten eerst.',
    views: ['afgehandeld', 'afgewezen', 'duplicaten'],
  },
]

const ALLES_GROUP: ViewGroup = {
  key: 'alles',
  label: 'Alles',
  hint: 'Alles wat open staat, behalve de archiefverwerking. Zoeken vindt hier ook gesloten dossiers.',
  views: ['alles'],
  single: true,
}

/** The groups in tab order, with the views saved in this browser in their own group before Alles. */
export function viewGroups(custom: readonly SavedView[]): ViewGroup[] {
  const own: ViewGroup[] = custom.length
    ? [
        {
          key: 'eigen',
          label: 'Eigen weergaven',
          hint: 'Bewaard in deze browser.',
          views: custom.map((v) => v.key),
        },
      ]
    : []
  return [...WORK_GROUPS, ...own, ALLES_GROUP]
}

/**
 * The tab a URL is on. A link without a `view`, or with a view that no longer
 * exists (a saved one deleted since), opens Alles with its own filters, as it
 * did before the groups. The bare link (the sidebar's) is the default tab;
 * the queue writes that one out in full before reading it.
 */
export function routeViewKey(
  raw: Record<string, unknown>,
  known: (key: string) => boolean,
): string {
  return typeof raw.view === 'string' && known(raw.view) ? raw.view : 'alles'
}

export function fromView(view: SavedView): ReviewQuery {
  const merged = { ...emptyQuery(), ...view.query }
  const sort = SORT_FIELDS.find((f) => f === merged.sort) ?? DEFAULT_SORT
  return { ...merged, sort, order: merged.order === 'desc' ? 'desc' : 'asc' }
}

/** Where a view lives: its own question on page 1, as a link. */
export const viewRoute = (view: SavedView) => ({
  name: 'review-queue',
  query: toRouteQuery(fromView(view), view.key),
})

const STORAGE_KEY = 'studio:review-views'

export function customViews(): SavedView[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (view): view is SavedView =>
        !!view &&
        typeof view === 'object' &&
        typeof (view as SavedView).key === 'string' &&
        typeof (view as SavedView).label === 'string' &&
        typeof (view as SavedView).query === 'object',
    )
  } catch {
    return []
  }
}

export function saveView(label: string, query: ReviewQuery): SavedView {
  const view: SavedView = {
    key: `custom:${label.toLowerCase().replace(/\s+/g, '-')}`,
    label,
    query: {
      q: query.q,
      channel: query.channel,
      state: query.state,
      overdue: query.overdue,
      building: query.building,
      kind: query.kind,
      outcome: query.outcome,
      // Left out before: a view saved from "Aan mij toegewezen" reopened as the whole queue.
      mine: query.mine,
      sort: query.sort,
      order: query.order,
    },
    builtin: false,
  }
  const next = [...customViews().filter((v) => v.key !== view.key), view]
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // A view that could not be persisted still applies for this session.
  }
  return view
}

export function deleteView(key: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customViews().filter((v) => v.key !== key)))
  } catch {
    // See above.
  }
}
