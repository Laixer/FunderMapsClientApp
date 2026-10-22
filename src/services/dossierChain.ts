/**
 * One dossier from document to FunderMaps, as a row of steps (2026-10-22).
 *
 * The Datastroom shows where all dossiers went; this is the same road for one:
 * what came in, what the reader looked at, what it found, what a person
 * judged, and where it ended up. Every number is counted from the dossier the
 * page already loaded; nothing is asked again.
 *
 * The words for "judged" and "open" are the page's own (ReviewDossierView):
 * a value is judged once a reviewer confirmed, corrected or rejected it, here
 * or on an earlier visit; the pipeline settles it itself ("automatisch") when
 * it agreed with the database or a later reading replaced it; everything else
 * is open. Short words throughout: six steps share one row of a 1528px window.
 */

import type { RouteLocationRaw } from 'vue-router'

import type { IReviewDossier, VerdictOutcome } from '@/services/fundermaps/interfaces/IDataops'
import { sourceLabel } from '@/services/dataflow'

/** done: passed · now: where the dossier is · stop: closed here without going further · todo: not reached. */
export type StepState = 'done' | 'now' | 'stop' | 'todo'

export interface ChainStep {
  key: 'received' | 'documents' | 'read' | 'found' | 'judged' | 'outcome'
  label: string
  value: string
  sub: string | null
  state: StepState
  link?: RouteLocationRaw
}

const JUDGED = new Set(['confirmed', 'corrected', 'rejected'])
const SETTLED = new Set(['agreed', 'superseded'])

const nl = (n: number) => n.toLocaleString('nl-NL')
/** "8 okt"; the year only when it is not this one. */
const shortDate = (iso: string) => {
  const at = new Date(iso)
  const year = at.getFullYear() === new Date().getFullYear() ? undefined : 'numeric'
  return at.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year })
}
const plural = (n: number, one: string, many: string) => `${nl(n)} ${n === 1 ? one : many}`

export function dossierChain(
  data: IReviewDossier,
  decided: Record<number, VerdictOutcome> = {},
  /** Closed on this visit, before the page reloads. */
  closedNow: string | null = null,
): ChainStep[] {
  const d = data.dossier
  const docs = data.artifacts.length
  const pagesRead = data.artifacts.reduce((n, a) => n + a.pages.length, 0)
  const pages = data.artifacts.reduce((n, a) => n + Math.max(a.pageCount ?? 0, a.pages.length), 0)
  const values = data.fields.filter((f) => f.state !== 'superseded')
  const judged = values.filter((f) => decided[f.id] || JUDGED.has(f.state)).length
  const settled = values.filter((f) => !decided[f.id] && SETTLED.has(f.state)).length
  const open = values.length - judged - settled
  const addresses = data.addresses.filter((a) => a.state !== 'rejected' && (a.total > 0 || a.own)).length
  const outcome = closedNow ?? d.outcome
  const finished = d.inquiryId != null || outcome != null

  const steps: ChainStep[] = []

  steps.push({
    key: 'received',
    label: 'Binnen',
    value: shortDate(d.receivedAt),
    // The source by the Datastroom's name for it, so the two pages say the same.
    sub: sourceLabel(d.channel),
    state: 'done',
  })

  steps.push({
    key: 'documents',
    label: 'Documenten',
    value: docs ? plural(docs, 'document', 'documenten') : 'geen document',
    sub: docs ? plural(pages, 'pagina', "pagina's") : 'een vraag zonder bijlage',
    state: docs ? 'done' : finished ? 'stop' : 'now',
  })

  const readState: StepState = !docs ? 'todo' : pagesRead ? 'done' : finished ? 'stop' : 'now'
  steps.push({
    key: 'read',
    label: 'Gelezen',
    value: !docs ? '—' : pagesRead ? `${nl(pagesRead)} van ${plural(pages, 'pagina', "pagina's")}` : 'nog niet gelezen',
    sub: docs && !pagesRead ? 'wacht op de documentlezer' : null,
    state: readState,
  })

  const foundState: StepState = readState !== 'done' ? 'todo' : values.length ? 'done' : finished ? 'stop' : 'now'
  steps.push({
    key: 'found',
    label: 'Gevonden',
    value: readState !== 'done' ? '—' : values.length ? plural(values.length, 'waarde', 'waarden') : 'niets gevonden',
    sub: values.length ? plural(addresses, 'adres', 'adressen') : null,
    state: foundState,
  })

  const judgeable = judged + open
  steps.push({
    key: 'judged',
    label: 'Beoordeeld',
    value: foundState !== 'done' ? '—' : judgeable ? `${nl(judged)} van ${nl(judgeable)}` : 'niets te beoordelen',
    sub:
      foundState !== 'done'
        ? null
        : [open ? `${nl(open)} open` : null, settled ? `${nl(settled)} automatisch` : null]
            .filter(Boolean)
            .join(' · ') || 'alles beoordeeld',
    state: foundState !== 'done' ? 'todo' : open ? (finished ? 'stop' : 'now') : 'done',
  })

  steps.push(outcomeStep(data, outcome))
  return steps
}

/** Where it ended up: in FunderMaps, closed without it, or not yet. */
function outcomeStep(data: IReviewDossier, outcome: string | null): ChainStep {
  const d = data.dossier
  if (d.inquiryId != null) {
    const rapportage = data.existingRapportages?.find((r) => r.id === d.inquiryId)
    const extra = [
      rapportage ? plural(rapportage.samples, 'sample', 'samples') : null,
      d.recoveryId ? `herstel #${d.recoveryId}` : null,
    ].filter(Boolean)
    return {
      key: 'outcome',
      label: 'In FunderMaps',
      value: `Rapportage #${d.inquiryId}`,
      sub: extra.length ? extra.join(' · ') : null,
      state: 'done',
      link: { name: 'inquiry-view', params: { id: d.inquiryId } },
    }
  }
  if (d.recoveryId) {
    return {
      key: 'outcome',
      label: 'In FunderMaps',
      value: `Herstel #${d.recoveryId}`,
      sub: null,
      state: 'done',
      link: { name: 'recovery-view', params: { id: d.recoveryId } },
    }
  }
  switch (outcome) {
    case 'duplicate':
      return {
        key: 'outcome',
        label: 'Gesloten',
        value: d.duplicateOf ? `Duplicaat van #${d.duplicateOf}` : 'Duplicaat',
        sub: 'zonder rapportage',
        state: 'stop',
        link: d.duplicateOf ? { name: 'review-dossier', params: { id: d.duplicateOf } } : undefined,
      }
    case 'rejected':
      return { key: 'outcome', label: 'Gesloten', value: 'Afgewezen', sub: 'zonder rapportage', state: 'stop' }
    case 'no_data':
      return { key: 'outcome', label: 'Gesloten', value: 'Geen gegevens', sub: 'zonder rapportage', state: 'stop' }
    case 'accepted':
      return { key: 'outcome', label: 'Gesloten', value: 'Afgehandeld', sub: 'zonder rapportage', state: 'stop' }
    default:
      return { key: 'outcome', label: 'FunderMaps', value: 'nog niet', sub: null, state: 'todo' }
  }
}
