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
  { value: 'unread', label: 'Nog niet gelezen' },
]

export const BUILDING_OPTIONS: readonly { value: 'resolved' | 'unresolved'; label: string }[] = [
  { value: 'resolved', label: 'Pand herkend' },
  { value: 'unresolved', label: 'Pand niet herkend' },
]

/** The kinds the pipeline can read, in the order a reviewer wants to pick from. */
export const KIND_OPTIONS: readonly { value: string; label: string }[] = Object.entries(
  INQUIRY_TYPE_CODE_LABELS,
).map(([value, label]) => ({ value, label }))

const CHANNELS = new Set(CHANNEL_OPTIONS.map((o) => o.value))
const STATES = new Set(STATE_OPTIONS.map((o) => o.value))
const KINDS = new Set(KIND_OPTIONS.map((o) => o.value))

export const channelLabel = (value: string) =>
  CHANNEL_OPTIONS.find((o) => o.value === value)?.label ?? value
export const kindLabel = (value: string) => INQUIRY_TYPE_CODE_LABELS[value] ?? value

/* -------------------------------------------------------------- sort fields */

export interface SortOption {
  value: QueueSort
  label: string
  asc: string
  desc: string
}

export const SORT_OPTIONS: readonly SortOption[] = [
  { value: 'received_at', label: 'Ontvangen', asc: 'oudste eerst', desc: 'nieuwste eerst' },
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

/** Only what differs from the default reaches the URL. */
export function toRouteQuery(query: ReviewQuery, viewKey: string): LocationQueryRaw {
  const out: LocationQueryRaw = {}
  if (viewKey !== 'alles') out.view = viewKey
  if (query.q) out.q = query.q
  if (query.channel.length) out.channel = query.channel.join(',')
  if (query.state.length) out.state = query.state.join(',')
  if (query.overdue) out.age = 'overdue'
  if (query.building) out.building = query.building
  if (query.kind.length) out.kind = query.kind.join(',')
  if (!isDefaultSort(query)) {
    out.sort = query.sort
    out.order = query.order
  }
  if (query.page > 1) out.page = String(query.page)
  return out
}

/* -------------------------------------------------------------- API mapping */

export function toQueueOpts(query: ReviewQuery): IQueueListOpts {
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
    values.map((v) => f(v).toLowerCase()).join(' of ')

  if (query.state.length) {
    chips.push({
      id: 'state',
      label: 'stand',
      value: labels(query.state, (v) => STATE_OPTIONS.find((o) => o.value === v)?.label ?? v),
      clear: (q) => ({ ...q, state: [], page: 1 }),
    })
  }
  if (query.channel.length) {
    chips.push({
      id: 'channel',
      label: 'via',
      value: labels(query.channel, channelLabel),
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

/** The questions a reviewer arrives with. */
export const BUILTIN_VIEWS: readonly SavedView[] = [
  { key: 'alles', label: 'Alles', query: {}, builtin: true },
  { key: 'voorstellen', label: 'Met voorstellen', query: { state: ['proposals'] }, builtin: true },
  { key: 'niets', label: 'Niets gevonden', query: { state: ['empty'] }, builtin: true },
  { key: 'ongelezen', label: 'Nog niet gelezen', query: { state: ['unread'] }, builtin: true },
  { key: 'te-lang', label: 'Te lang open', query: { overdue: true }, builtin: true },
  { key: 'studio', label: 'Studio-uploads', query: { channel: ['invoer_app'] }, builtin: true },
  { key: 'nalezing', label: 'Nalezingen', query: { channel: ['audit'] }, builtin: true },
]

export function fromView(view: SavedView): ReviewQuery {
  const merged = { ...emptyQuery(), ...view.query }
  const sort = SORT_FIELDS.find((f) => f === merged.sort) ?? DEFAULT_SORT
  return { ...merged, sort, order: merged.order === 'desc' ? 'desc' : 'asc' }
}

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
