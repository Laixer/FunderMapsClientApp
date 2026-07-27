/**
 * The explorer's question, as one object.
 *
 * Every filter, the sort and the page live in a single `ExplorerQuery` that
 * serialises to the URL and back. That is what makes a view shareable: the
 * answer to "which 1.284 rows are you looking at?" is the address bar, so a
 * link in Slack lands the next person on exactly the same set rather than on
 * everything.
 *
 * Saved views are the same object under a name. The five built-ins cover the
 * questions people arrive with; anything else can be saved per user — in
 * `localStorage`, because the API has nowhere to put a per-user view and one
 * person's filter preset is not worth a schema change.
 */

import type { LocationQueryRaw } from 'vue-router'

import type { IInquiryListOpts } from '@/services/fundermaps/endpoints/inquiry'
import { AUDIT_STATUS, INQUIRY_TYPE_LABELS, statusMeta } from '@/services/inquiryEnums'

export type SortField = NonNullable<IInquiryListOpts['sort']>

export interface ExplorerQuery {
  q: string
  /** auditStatus wire integers; combined as OR by the API. */
  status: number[]
  /** Inquiry type integers. Applied client-side — see `filterByType`. */
  type: number[]
  /** Restrict to rows where you are the reviewer or the creator. */
  mine: 'reviewer' | 'creator' | null
  sort: SortField | null
  order: 'asc' | 'desc'
  /** 1-based. */
  page: number
}

/**
 * How many rows a page of the explorer holds.
 *
 * Twenty, not fifty: at 34–38px a row, twenty is about what a desktop viewport
 * shows without scrolling, so Volgende replaces the scrollbar instead of coming
 * after it. It also costs the client-side type filter less — that one narrows
 * the page rather than the query, and a smaller page is a smaller thing to
 * narrow, so `filterByType` leans harder on the caveat the popover already
 * states.
 */
export const PAGE_SIZE = 20

export function emptyQuery(): ExplorerQuery {
  return { q: '', status: [], type: [], mine: null, sort: null, order: 'desc', page: 1 }
}

export interface SavedView {
  key: string
  label: string
  query: Partial<ExplorerQuery>
  /** Built-ins cannot be renamed or deleted. */
  builtin: boolean
}

export const BUILTIN_VIEWS: readonly SavedView[] = [
  { key: 'alles', label: 'Alles', query: {}, builtin: true },
  {
    key: 'te-controleren',
    label: 'Te controleren',
    query: { status: [AUDIT_STATUS.PENDING_REVIEW], mine: 'reviewer' },
    builtin: true,
  },
  {
    key: 'mijn-invoer',
    label: 'Mijn invoer',
    query: { status: [AUDIT_STATUS.TODO, AUDIT_STATUS.PENDING], mine: 'creator' },
    builtin: true,
  },
  {
    key: 'afgekeurd',
    label: 'Afgekeurd',
    query: { status: [AUDIT_STATUS.REJECTED], mine: 'creator' },
    builtin: true,
  },
  {
    key: 'concepten',
    label: 'Concepten',
    query: { status: [AUDIT_STATUS.TODO, AUDIT_STATUS.PENDING] },
    builtin: true,
  },
]

/* ---------------------------------------------------------------- URL state */

function ints(raw: unknown, valid: (n: number) => boolean): number[] {
  if (typeof raw !== 'string') return []

  const out: number[] = []
  for (const part of raw.split(',')) {
    const trimmed = part.trim()
    // Blank segments are dropped *before* conversion, not after. `Number('')`
    // is 0, and 0 is a perfectly good `todo` — so filtering only on "is this a
    // known value" lets `?status=,,` through as three todo filters nobody asked
    // for. This is the bug the previous version's comment claimed to fix.
    if (!trimmed) continue
    const value = Number(trimmed)
    if (!Number.isInteger(value) || !valid(value)) continue
    // Deduped, so `?status=4,4` is one chip and one filter rather than two.
    if (!out.includes(value)) out.push(value)
  }
  return out
}

/* -------------------------------------------------------------- sort fields */

export interface SortOption {
  value: SortField
  label: string
  /** What the two directions actually mean for this column. */
  asc: string
  desc: string
}

/**
 * The sortable columns, in the order the filter popover offers them.
 *
 * Each direction gets a label of its own rather than a shared
 * "oplopend / aflopend": on a date column that is a word people have to
 * translate into "oudste eerst" before they can use it, and translating a
 * control is how you end up clicking it twice to find out what it does.
 *
 * `creator` and `reviewer` sort on the user's e-mail address server-side —
 * which is the string the table shows, so A→Z means what it looks like.
 * `type` and `status` sort on the PostgreSQL enum's declaration order: that
 * groups the rows, but the order between groups carries no meaning (in
 * `report.audit_status`, `rejected` precedes `pending_review`). Said out loud
 * in the popover rather than dressed up as a ranking.
 */
export const SORT_OPTIONS: readonly SortOption[] = [
  { value: 'document_date', label: 'Datum', asc: 'oudste eerst', desc: 'nieuwste eerst' },
  { value: 'id', label: 'ID', asc: 'laagste eerst', desc: 'hoogste eerst' },
  { value: 'document_name', label: 'Naam', asc: 'A → Z', desc: 'Z → A' },
  { value: 'type', label: 'Type', asc: 'oplopend', desc: 'aflopend' },
  { value: 'status', label: 'Status', asc: 'oplopend', desc: 'aflopend' },
  { value: 'creator', label: 'Opsteller', asc: 'A → Z', desc: 'Z → A' },
  { value: 'reviewer', label: 'Beoordelaar', asc: 'A → Z', desc: 'Z → A' },
]

const SORT_FIELDS: readonly SortField[] = SORT_OPTIONS.map((option) => option.value)

export function sortOption(field: SortField): SortOption {
  return SORT_OPTIONS.find((option) => option.value === field) ?? SORT_OPTIONS[0]
}

/** `datum · nieuwste eerst` — the sort as one readable phrase. */
export function describeSort(sort: SortField, order: 'asc' | 'desc'): string {
  const option = sortOption(sort)
  return `${option.label.toLowerCase()} · ${order === 'asc' ? option.asc : option.desc}`
}

export function parseQuery(raw: Record<string, unknown>): ExplorerQuery {
  const page = Number(raw.page)
  const sort = SORT_FIELDS.find((field) => field === raw.sort) ?? null
  return {
    q: typeof raw.q === 'string' ? raw.q : '',
    status: ints(raw.status, (n) => statusMeta(n).label !== 'Onbekend'),
    type: ints(raw.type, (n) => INQUIRY_TYPE_LABELS[n] !== undefined),
    mine: raw.mine === 'reviewer' || raw.mine === 'creator' ? raw.mine : null,
    sort,
    order: raw.order === 'asc' ? 'asc' : 'desc',
    page: Number.isInteger(page) && page > 0 ? page : 1,
  }
}

/**
 * Only what differs from the default reaches the URL, so a plain browse has a
 * clean address and a shared link contains nothing but the question asked.
 */
export function toRouteQuery(query: ExplorerQuery, viewKey: string): LocationQueryRaw {
  const out: LocationQueryRaw = {}
  if (viewKey !== 'alles') out.view = viewKey
  if (query.q) out.q = query.q
  if (query.status.length) out.status = query.status.join(',')
  if (query.type.length) out.type = query.type.join(',')
  if (query.mine) out.mine = query.mine
  if (query.sort) {
    out.sort = query.sort
    out.order = query.order
  }
  if (query.page > 1) out.page = String(query.page)
  return out
}

/** A saved view's stored shape, merged over the empty query. */
export function fromView(view: SavedView): ExplorerQuery {
  return { ...emptyQuery(), ...view.query }
}

/* -------------------------------------------------------------- API mapping */

/**
 * Turn the query into list options.
 *
 * `type` is absent on purpose: `GET /inquiry` takes no type filter, so type
 * narrowing happens client-side over the page — see `filterByType`. It is
 * called out here rather than silently dropped, because a filter that quietly
 * does nothing is worse than one that visibly filters only what is on screen.
 */
export function toListOpts(query: ExplorerQuery, userId: string | null): IInquiryListOpts {
  const opts: IInquiryListOpts = {
    limit: PAGE_SIZE,
    offset: (query.page - 1) * PAGE_SIZE,
  }
  if (query.q.trim()) opts.q = query.q.trim()
  if (query.status.length) opts.status = [...query.status]
  if (query.mine === 'creator' && userId) opts.creator = userId
  if (query.mine === 'reviewer' && userId) opts.reviewer = userId
  if (query.sort) {
    opts.sort = query.sort
    opts.order = query.order
  }
  return opts
}

export function filterByType<T extends { type: number | null }>(
  rows: T[],
  types: number[],
): T[] {
  if (!types.length) return rows
  return rows.filter((row) => row.type !== null && types.includes(row.type))
}

/* ------------------------------------------------------------- filter chips */

export interface Chip {
  id: string
  label: string
  value: string
  /** Which part of the query the chip removes. */
  clear: (query: ExplorerQuery) => ExplorerQuery
}

const MINE_LABELS: Record<'reviewer' | 'creator', string> = {
  reviewer: 'ik beoordeel',
  creator: 'ik stelde op',
}

/** One removable chip per active filter, plus one for the sort — see `FilterChip`. */
export function chipsFor(query: ExplorerQuery): Chip[] {
  const chips: Chip[] = []

  if (query.status.length) {
    chips.push({
      id: 'status',
      label: 'status',
      value: query.status.map((s) => statusMeta(s).label.toLowerCase()).join(' of '),
      clear: (q) => ({ ...q, status: [], page: 1 }),
    })
  }

  if (query.type.length) {
    chips.push({
      id: 'type',
      label: 'type',
      value: query.type.map((t) => INQUIRY_TYPE_LABELS[t] ?? String(t)).join(' of '),
      clear: (q) => ({ ...q, type: [], page: 1 }),
    })
  }

  if (query.mine) {
    chips.push({
      id: 'mine',
      label: 'toewijzing',
      value: MINE_LABELS[query.mine],
      clear: (q) => ({ ...q, mine: null, page: 1 }),
    })
  }

  // The sort is not a filter, but it belongs here for the same reason the
  // filters do: it changes which rows you see first, it survives in a shared
  // link, and half of what you can sort on (opsteller) has no column in the
  // table to carry an arrow. Clearing it returns to the API's own ordering.
  if (query.sort) {
    chips.push({
      id: 'sort',
      label: 'sortering',
      value: describeSort(query.sort, query.order),
      clear: (q) => ({ ...q, sort: null, order: 'desc', page: 1 }),
    })
  }

  return chips
}

/* ------------------------------------------------------- user's saved views */

const STORAGE_KEY = 'studio:views'

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

export function saveView(label: string, query: ExplorerQuery): SavedView {
  const view: SavedView = {
    // Keyed by label rather than by a counter, so saving "Rotterdam" twice
    // updates the view instead of stacking two tabs with the same name.
    key: `custom:${label.toLowerCase().replace(/\s+/g, '-')}`,
    label,
    // The sort travels with the view: "te controleren, oudste eerst" is one
    // saved question, not a filter plus a setting you have to reapply.
    query: {
      q: query.q,
      status: query.status,
      type: query.type,
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
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(customViews().filter((view) => view.key !== key)),
    )
  } catch {
    // See above.
  }
}
