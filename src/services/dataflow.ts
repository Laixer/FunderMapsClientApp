/**
 * The Datastroom: where every dossier went, as a picture.
 *
 * Three columns. On the left where it came from (the channel), in the middle
 * what became of it (in FunderMaps, closed without a rapportage, still open),
 * on the right the detail of the last two. Every band is as thick as the
 * number of dossiers it carries, on one scale, so the picture can be read
 * without the numbers and checked with them.
 *
 * Pure: the page fetches GET /dataops/flow and draws what this returns. The
 * colours are by outcome only (three, the Studio's own tokens); which source
 * a band came from is said by its label, never by a colour.
 */

import type { LocationQueryRaw } from 'vue-router'

import type { FlowBucket, IDataopsFlow } from '@/services/fundermaps/interfaces/IDataops'
import { BUILTIN_VIEWS, emptyQuery, fromView, toRouteQuery, type ReviewQuery } from '@/services/reviewExplorer'

export type FlowGroup = 'done' | 'closed' | 'open'

/** The channels in the order the Studio lists them under Controle; their own view there. */
export const SOURCES: readonly { channel: string; label: string; view: string }[] = [
  { channel: 'upload', label: 'Meldingen', view: 'beantwoorden' },
  { channel: 'email', label: 'E-mail', view: 'alles' },
  { channel: 'invoer_app', label: 'Studio-uploads', view: 'studio' },
  { channel: 'audit', label: 'Nalezingen', view: 'nalezing' },
  { channel: 'api', label: 'Archiefwijzer', view: 'archiefwijzer' },
  { channel: 'bulk_drop', label: 'Archiefverwerking', view: 'archiefverwerking' },
]

export const GROUPS: readonly { group: FlowGroup; label: string; short: string }[] = [
  { group: 'done', label: 'In FunderMaps', short: 'in FunderMaps' },
  { group: 'closed', label: 'Gesloten zonder rapportage', short: 'gesloten' },
  { group: 'open', label: 'Nog open', short: 'open' },
]

export const BUCKETS: readonly { bucket: FlowBucket; group: FlowGroup; label: string }[] = [
  { bucket: 'rapportage', group: 'done', label: 'Rapportage' },
  { bucket: 'accepted', group: 'closed', label: 'Afgehandeld zonder rapportage' },
  { bucket: 'no_data', group: 'closed', label: 'Geen gegevens' },
  { bucket: 'rejected', group: 'closed', label: 'Afgewezen' },
  { bucket: 'duplicate', group: 'closed', label: 'Duplicaat' },
  { bucket: 'question', group: 'open', label: 'Geen document' },
  { bucket: 'unread', group: 'open', label: 'Nog niet gelezen' },
  { bucket: 'empty', group: 'open', label: 'Niets gevonden' },
  { bucket: 'proposals', group: 'open', label: 'Te beoordelen' },
  { bucket: 'judged', group: 'open', label: 'Beoordeeld, niet afgerond' },
]

const groupOf = (bucket: FlowBucket): FlowGroup => BUCKETS.find((b) => b.bucket === bucket)?.group ?? 'open'
export const sourceLabel = (channel: string) => SOURCES.find((s) => s.channel === channel)?.label ?? channel

/* -------------------------------------------------------------- the graph */

export interface FlowNode {
  id: string
  column: 0 | 1 | 2
  label: string
  value: number
  /** Sources are neutral; the rest take their group's colour. */
  group: FlowGroup | null
  /** Where a click on it goes (Controle, or Rapportages for what is in FunderMaps). */
  link: { name: string; query?: LocationQueryRaw }
}

export interface FlowLink {
  id: string
  source: string
  target: string
  value: number
  group: FlowGroup
  link: { name: string; query?: LocationQueryRaw }
}

/** A Controle link: a built-in view, narrowed by what the band or node stands for. */
function queueLink(viewKey: string, narrow: Partial<ReviewQuery> = {}) {
  const view = BUILTIN_VIEWS.find((v) => v.key === viewKey)
  const query: ReviewQuery = { ...(view ? fromView(view) : emptyQuery()), ...narrow }
  return { name: 'review-queue', query: toRouteQuery(query, viewKey) }
}

/**
 * Where a slice opens. Open dossiers: the desk, by channel and state where the
 * queue has one ("beoordeeld, niet afgerond" has none). Closed: the outcome's
 * own tab. What is in FunderMaps: Rapportages, because that is where it lives.
 */
function sliceLink(group: FlowGroup, bucket: FlowBucket | null, channel: string | null) {
  const channels = channel ? { channel: [channel as ReviewQuery['channel'][number]] } : { channel: [] }
  if (group === 'done') return channel ? queueLink('afgehandeld', { ...channels, outcome: ['accepted'] }) : { name: 'inquiry-list' }
  if (group === 'closed') {
    const outcome: ReviewQuery['outcome'] = bucket
      ? [bucket as ReviewQuery['outcome'][number]]
      : ['accepted', 'no_data', 'rejected', 'duplicate']
    const view = bucket === 'rejected' ? 'afgewezen' : bucket === 'duplicate' ? 'duplicaten' : 'afgehandeld'
    return queueLink(view, { ...channels, outcome })
  }
  const state: ReviewQuery['state'] =
    bucket === 'question' || bucket === 'unread' || bucket === 'empty' || bucket === 'proposals' ? [bucket] : []
  const sourceView = channel ? (SOURCES.find((s) => s.channel === channel)?.view ?? 'alles') : 'alles'
  return queueLink(state.length || !channel ? 'alles' : sourceView, { ...channels, state })
}

export function buildFlow(data: IDataopsFlow): { nodes: FlowNode[]; links: FlowLink[]; total: number } {
  const bySource = new Map<string, Map<FlowGroup, number>>()
  const byBucket = new Map<FlowBucket, number>()
  let total = 0
  for (const row of data.flow) {
    const g = groupOf(row.bucket)
    const groups = bySource.get(row.channel) ?? new Map<FlowGroup, number>()
    groups.set(g, (groups.get(g) ?? 0) + row.count)
    bySource.set(row.channel, groups)
    byBucket.set(row.bucket, (byBucket.get(row.bucket) ?? 0) + row.count)
    total += row.count
  }

  const sourceOrder = [...SOURCES.map((s) => s.channel), ...[...bySource.keys()].filter((c) => !SOURCES.some((s) => s.channel === c))]
  const nodes: FlowNode[] = []
  const links: FlowLink[] = []

  for (const channel of sourceOrder) {
    const groups = bySource.get(channel)
    if (!groups) continue
    const value = [...groups.values()].reduce((a, b) => a + b, 0)
    const meta = SOURCES.find((s) => s.channel === channel)
    nodes.push({
      id: `source:${channel}`,
      column: 0,
      label: sourceLabel(channel),
      value,
      group: null,
      link: queueLink(meta?.view ?? 'alles', { channel: [channel as ReviewQuery['channel'][number]] }),
    })
    for (const { group } of GROUPS) {
      const v = groups.get(group) ?? 0
      if (v > 0) {
        links.push({ id: `${channel}>${group}`, source: `source:${channel}`, target: `group:${group}`, value: v, group, link: sliceLink(group, null, channel) })
      }
    }
  }

  for (const { group, label } of GROUPS) {
    const value = BUCKETS.filter((b) => b.group === group).reduce((n, b) => n + (byBucket.get(b.bucket) ?? 0), 0)
    if (value > 0) nodes.push({ id: `group:${group}`, column: 1, label, value, group, link: sliceLink(group, null, null) })
  }

  // What is in FunderMaps needs no right-hand detail: it is one thing, a rapportage.
  for (const { bucket, group, label } of BUCKETS) {
    if (group === 'done') continue
    const value = byBucket.get(bucket) ?? 0
    if (value === 0) continue
    nodes.push({ id: `bucket:${bucket}`, column: 2, label, value, group, link: sliceLink(group, bucket, null) })
    links.push({ id: `${group}>${bucket}`, source: `group:${group}`, target: `bucket:${bucket}`, value, group, link: sliceLink(group, bucket, null) })
  }

  return { nodes, links, total }
}

/* ------------------------------------------------------------- the layout */

export interface PlacedNode extends FlowNode {
  x: number
  y: number
  height: number
}

export interface PlacedLink extends FlowLink {
  /** A filled band from the source's right edge to the target's left edge. */
  path: string
  width: number
  /** The band's middle on both ends, for a hover marker. */
  y0: number
  y1: number
}

export interface FlowLayoutOptions {
  /** x of each column's nodes. */
  columns: [number, number, number]
  nodeWidth: number
  /** Pixels for all dossiers together: one scale for every band and node. */
  span: number
  /** Space between two nodes in a column. */
  gap: number
  /** Room a node takes at least, so a label always fits beside even the thinnest. */
  minSlot: number
  top: number
}

/**
 * Places nodes top-down per column and threads every band through them. The
 * middle column's detail starts level with "gesloten", the first group that
 * has one, so the bands to the right barely bend.
 */
export function layoutFlow(nodes: FlowNode[], links: FlowLink[], total: number, o: FlowLayoutOptions) {
  const k = total > 0 ? o.span / total : 0
  // A band is never thinner than a hairline: one dossier must still be visible.
  const width = (v: number) => Math.max(v * k, 1)
  const outSum = new Map<string, number>()
  const inSum = new Map<string, number>()
  for (const l of links) {
    outSum.set(l.source, (outSum.get(l.source) ?? 0) + width(l.value))
    inSum.set(l.target, (inSum.get(l.target) ?? 0) + width(l.value))
  }
  const heightOf = (n: FlowNode) => Math.max(n.value * k, outSum.get(n.id) ?? 0, inSum.get(n.id) ?? 0, 2)

  const placed = new Map<string, PlacedNode>()
  for (const column of [0, 1, 2] as const) {
    let y = o.top
    if (column === 2) {
      const firstWithDetail = nodes.find((n) => n.column === 1 && n.group !== 'done')
      const anchor = firstWithDetail && placed.get(firstWithDetail.id)
      if (anchor) y = anchor.y
    }
    for (const n of nodes.filter((n) => n.column === column)) {
      const height = heightOf(n)
      placed.set(n.id, { ...n, x: o.columns[column], y, height })
      y += Math.max(height, o.minSlot) + o.gap
    }
  }

  const outAt = new Map<string, number>()
  const inAt = new Map<string, number>()
  const placedLinks: PlacedLink[] = links.map((l) => {
    const s = placed.get(l.source)!
    const t = placed.get(l.target)!
    const w = width(l.value)
    const sy = s.y + (outAt.get(s.id) ?? 0)
    const ty = t.y + (inAt.get(t.id) ?? 0)
    outAt.set(s.id, (outAt.get(s.id) ?? 0) + w)
    inAt.set(t.id, (inAt.get(t.id) ?? 0) + w)
    const x0 = s.x + o.nodeWidth
    const x1 = t.x
    const xm = (x0 + x1) / 2
    const path = `M${x0},${sy}C${xm},${sy} ${xm},${ty} ${x1},${ty}L${x1},${ty + w}C${xm},${ty + w} ${xm},${sy + w} ${x0},${sy + w}Z`
    return { ...l, path, width: w, y0: sy + w / 2, y1: ty + w / 2 }
  })

  const bottom = Math.max(...[...placed.values()].map((n) => n.y + Math.max(n.height, o.minSlot)), o.top)
  return { nodes: [...placed.values()], links: placedLinks, height: bottom }
}

/* --------------------------------------------------------------- per source */

export interface SourceRow {
  channel: string
  label: string
  total: number
  done: number
  closed: number
  open: number
  received: number[]
  closedPerWeek: number[]
  /** How long its open dossiers have waited; null when the API does not say. */
  waiting: { bands: number[]; medianDays: number | null } | null
}

/** The age bands of `waiting`, newest first, in the words of the tooltip. */
export const AGE_BANDS = ['korter dan een week', '1 tot 2 weken', '2 weken tot een maand', '1 tot 3 maanden', 'langer dan 3 maanden'] as const

/** One row per channel for the table under the picture: the split, and the last 12 weeks in and out. */
export function sourceRows(data: IDataopsFlow): SourceRow[] {
  const rows = new Map<string, SourceRow>()
  const row = (channel: string) => {
    let r = rows.get(channel)
    if (!r) {
      r = {
        channel,
        label: sourceLabel(channel),
        total: 0,
        done: 0,
        closed: 0,
        open: 0,
        received: data.weeks.map(() => 0),
        closedPerWeek: data.weeks.map(() => 0),
        waiting: null,
      }
      rows.set(channel, r)
    }
    return r
  }
  for (const f of data.flow) {
    const r = row(f.channel)
    r.total += f.count
    r[groupOf(f.bucket)] += f.count
  }
  for (const w of data.weekly) {
    const i = data.weeks.indexOf(w.week)
    if (i < 0) continue
    const r = row(w.channel)
    r.received[i] = w.received
    r.closedPerWeek[i] = w.closed
  }
  for (const w of data.waiting ?? []) {
    row(w.channel).waiting = { bands: [w.week, w.twoWeeks, w.month, w.quarter, w.older], medianDays: w.medianDays }
  }
  const order = (c: string) => {
    const i = SOURCES.findIndex((s) => s.channel === c)
    return i < 0 ? SOURCES.length : i
  }
  return [...rows.values()].sort((a, b) => order(a.channel) - order(b.channel))
}
