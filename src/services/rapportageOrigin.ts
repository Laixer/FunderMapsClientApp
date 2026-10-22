/**
 * A rapportage's road back to where it came from (2026-10-22): the dossier
 * steps of the review page, the other way round, ending in what it changed.
 *
 * Bron (the dossier, or "met de hand ingevoerd") · Documenten · Beoordeeld ·
 * Overgenomen · Deze rapportage · Daarna in FunderMaps (the risk
 * recalculation after the take-over: "droogstand D → A") · Nalezing (when the
 * rapportage was read again). Drawn by ChainRow, like the dossier's road.
 */

import type { IRapportageOrigin } from '@/services/fundermaps/interfaces/IDataops'
import { sourceLabel } from '@/services/dataflow'
import type { ChainStep } from '@/services/dossierChain'

const nl = (n: number) => n.toLocaleString('nl-NL')
const plural = (n: number, one: string, many: string) => `${nl(n)} ${n === 1 ? one : many}`
/** "8 okt"; the year only when it is not this one. */
const shortDate = (iso: string) => {
  const at = new Date(iso)
  const year = at.getFullYear() === new Date().getFullYear() ? undefined : 'numeric'
  return at.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year })
}
/** A risk class as the map shows it: "d" → "D"; nothing → "—". */
const klass = (v: string | null) => (v ? v.toUpperCase() : '—')
const names = (list: string[]) => (list.length <= 1 ? (list[0] ?? null) : `${list[0]} +${list.length - 1}`)

export interface OriginInput {
  id: number
  /** For a rapportage typed in by hand: who, and when. */
  creatorName: string | null
  createDate: string | null
  /** Addresses (samples) on it now. */
  samples: number
}

export function originSteps(origin: IRapportageOrigin, r: OriginInput): ChainStep[] {
  const steps: ChainStep[] = []
  const [first, ...more] = origin.dossiers

  if (!first) {
    steps.push({
      key: 'source',
      label: 'Bron',
      value: 'Met de hand ingevoerd',
      sub: [r.creatorName, r.createDate ? shortDate(r.createDate) : null].filter(Boolean).join(' · ') || null,
      state: 'done',
    })
  } else {
    const all = origin.dossiers
    const docs = all.flatMap((d) => d.documents)
    const pages = docs.reduce((n, d) => n + d.pages, 0)
    const found = all.reduce((n, d) => n + d.found, 0)
    const judged = all.reduce((n, d) => n + d.judged, 0)
    const judges = [...new Set(all.flatMap((d) => d.judgedBy))]
    const commit = all.map((d) => d.committed).find(Boolean) ?? null

    steps.push({
      key: 'source',
      label: 'Bron',
      value: first.reference ?? `Dossier #${first.id}`,
      sub: more.length ? `${sourceLabel(first.channel)} +${plural(more.length, 'dossier', 'dossiers')}` : sourceLabel(first.channel),
      title: all.map((d) => `${d.reference ?? `Dossier #${d.id}`} (${sourceLabel(d.channel)}, ontvangen ${shortDate(d.receivedAt)})`).join('\n'),
      state: 'done',
      link: { name: 'review-dossier', params: { id: first.id } },
    })
    steps.push({
      key: 'documents',
      label: 'Documenten',
      value: docs.length ? plural(docs.length, 'document', 'documenten') : 'geen document',
      sub: docs.length ? plural(pages, 'pagina', "pagina's") : null,
      title: docs.map((d) => d.name ?? `Document ${d.id}`).join('\n') || undefined,
      state: docs.length ? 'done' : 'stop',
    })
    steps.push({
      key: 'judged',
      label: 'Beoordeeld',
      // "10 van 10": under the label BEOORDEELD that is enough; the whole sentence is in the tooltip.
      value: found ? `${nl(judged)} van ${nl(found)}` : 'met de hand ingevuld',
      sub: names(judges),
      title: found
        ? `${nl(judged)} van ${plural(found, 'waarde', 'waarden')} beoordeeld${judges.length ? ` door ${judges.join(', ')}` : ''}`
        : undefined,
      state: 'done',
    })
    steps.push({
      key: 'committed',
      label: 'Overgenomen',
      value: commit ? shortDate(commit.at) : 'overgenomen',
      sub: commit?.by ?? null,
      state: 'done',
    })
  }

  steps.push({
    key: 'this',
    label: 'Deze rapportage',
    value: `#${r.id}`,
    // No addresses yet says nothing worth a line; the page shows that below.
    sub: r.samples ? plural(r.samples, 'adres', 'adressen') : null,
    state: 'now',
  })

  if (first) {
    const risk = origin.dossiers.map((d) => d.risk).find(Boolean) ?? null
    const changes = risk?.changed.flatMap((c) => c.fields.map((f) => ({ ...f, address: c.address }))) ?? []
    const say = (f: (typeof changes)[number]) => `${f.label} ${klass(f.before)} → ${klass(f.after)}`
    steps.push({
      key: 'effect',
      label: 'Daarna in FunderMaps',
      value: !risk ? 'nog niet herberekend' : changes.length ? say(changes[0]) : 'risico ongewijzigd',
      sub: changes.length > 1 ? `+${changes.length - 1} meer` : null,
      title: changes.length
        ? risk!.changed.map((c) => `${c.address ?? 'Pand'}: ${c.fields.map((f) => `${f.label} ${klass(f.before)} → ${klass(f.after)}`).join(', ')}`).join('\n')
        : undefined,
      state: risk ? 'done' : 'todo',
    })
  }

  const audit = origin.audits[0]
  if (audit) {
    const closed = audit.outcome != null
    steps.push({
      key: 'audit',
      label: 'Nalezing',
      value: origin.audits.length > 1 ? `${origin.audits.length}× nagelezen` : `nagelezen ${shortDate(audit.receivedAt)}`,
      sub: closed ? 'afgerond' : `${nl(audit.open)} open`,
      state: closed ? 'done' : 'todo',
      link: { name: 'review-dossier', params: { id: audit.id } },
    })
  }
  return steps
}
