/**
 * What the command palette can find.
 *
 * Three kinds of result share one list, because from the keyboard they are the
 * same gesture: type a few characters, press Enter, end up somewhere. A
 * destination, a dossier and an action are only different once you stop to
 * think about them, and the point of the palette is not to stop.
 *
 * Record results come from the same server-side search the explorer uses
 * (`GET /inquiry?q=`), which already spans id, document name, sample address
 * and BAG identifiers — so a pand-ID pasted into the palette finds the dossier
 * that mentions it.
 */

import type { RouteLocationRaw } from 'vue-router'

import api from '@/services/fundermaps'
import router from '@/router'
import { inquiryTypeLabel } from '@/services/inquiryEnums'
import { NAV_ITEMS } from '@/services/navigation'
import { recoveryDocumentTypeLabel } from '@/services/recoveryEnums'
import { outcomeLabel } from '@/services/reviewExplorer'

export type PaletteKind = 'GA NAAR' | 'PAND' | 'DOSSIER' | 'RAPPORTAGE' | 'HERSTEL' | 'ACTIE'

export interface PaletteItem {
  id: string
  kind: PaletteKind
  label: string
  /** Right-aligned mono hint: a shortcut, or the record's own metadata. */
  hint?: string
  to?: RouteLocationRaw
  run?: () => void
}

/** How many records a query returns before the list stops being scannable. */
export const PALETTE_RESULT_LIMIT = 6

/** Navigation rows, filtered by a plain substring match on the label. */
export function navigationItems(query: string): PaletteItem[] {
  const q = query.trim().toLowerCase()
  return NAV_ITEMS.filter((item) => !q || item.label.toLowerCase().includes(q)).map((item) => ({
    id: `nav:${item.route}`,
    kind: 'GA NAAR' as const,
    label: item.label,
    hint: `g ${item.key}`,
    to: { name: item.route },
  }))
}

export interface PaletteAction {
  id: string
  label: string
  hint?: string
  to?: RouteLocationRaw
  run?: () => void
}

export function actionItems(query: string, actions: PaletteAction[]): PaletteItem[] {
  const q = query.trim().toLowerCase()
  return actions
    .filter((action) => !q || action.label.toLowerCase().includes(q))
    .map((action) => ({ ...action, id: `action:${action.id}`, kind: 'ACTIE' as const }))
}

/** The meldcode we print in every mail to a melder, e.g. `FM2026-000111`. */
const MELDCODE = /^FM\d{4}-\d{6}$/i
/**
 * A BAG number: four digits of the municipality, two of the object type
 * (10 pand, 20 nummeraanduiding), ten more; with or without the NL.IMBAG.
 * prefix. Either opens the Pand page, which finds the pand of an address.
 */
const BAG_ID = /^(?:NL\.IMBAG\.(PAND|NUMMERAANDUIDING)\.)?(\d{4}(10|20)\d{10})$/i

/** The Pand page for a pasted BAG number, or nothing. */
export function pandItem(query: string): PaletteItem | null {
  const m = BAG_ID.exec(query.trim())
  if (!m) return null
  const digits = m[2]!
  const address = (m[1]?.toUpperCase() ?? (m[3] === '20' ? 'NUMMERAANDUIDING' : 'PAND')) === 'NUMMERAANDUIDING'
  const id = `NL.IMBAG.${address ? 'NUMMERAANDUIDING' : 'PAND'}.${digits}`
  return {
    id: `pand:${id}`,
    kind: 'PAND',
    label: address ? `Pand van adres ${digits}` : `Pand ${digits}`,
    hint: 'levenslijn en model',
    to: { name: 'building', params: { id } },
  }
}

/**
 * Records matching the query: inquiries, recoveries, and — when the query is a
 * meldcode — the melding itself.
 *
 * Every lookup is allowed to fail independently: the palette losing its
 * recovery results is a smaller problem than the palette showing nothing
 * because one endpoint was slow, and a search box that sometimes returns an
 * error instead of results is a search box people stop using.
 */
export async function recordItems(query: string): Promise<PaletteItem[]> {
  // Every screen prints a number as "#160810"; pasted like that it found nothing.
  const q = query.trim().replace(/^#/, '')
  if (q.length < 2) return []

  // Something that reads like an address (a word and a number): its pand, via PDOK (2026-10-22).
  const addressLike = /[a-z]{3,}/i.test(q) && /\d/.test(q) && !MELDCODE.test(q) && !BAG_ID.test(q)
  const [inquiries, recoveries, meldingen, places] = await Promise.all([
    api.inquiry.list({ q, limit: PALETTE_RESULT_LIMIT }).catch(() => []),
    api.recovery.list({ q, limit: 3 }).catch(() => []),
    // A meldcode arrives from outside the system -- a melder's mail, a phone
    // call, a question forwarded by Don -- and the person holding it wants that
    // dossier, not a list (#361). The API matches it in any state, so a closed
    // one is found too; the hint says which, because "afgewezen" is usually the
    // answer to the question being asked.
    MELDCODE.test(q) ? api.dataops.queue({ q, limit: 1 }).catch(() => []) : Promise.resolve([]),
    addressLike ? api.pdok.suggest(q, 3).catch(() => []) : Promise.resolve([]),
  ])

  const pand = pandItem(q)
  return [
    ...(pand ? [pand] : []),
    ...places.map((s) => ({
      id: `pdok:${s.id}`,
      kind: 'PAND' as const,
      label: s.weergavenaam,
      hint: 'pand',
      // The address resolves to its BAG id on choosing; the Pand page moves on to the pand.
      run: () => {
        void api.pdok.lookupNummeraanduidingId(s.id).then((id) => {
          if (id) void router.push({ name: 'building', params: { id } })
        })
      },
    })),
    ...meldingen.map((row) => ({
      id: `melding:${row.id}`,
      kind: 'DOSSIER' as const,
      label: `${row.reference ?? `#${row.id}`} · ${row.subject ?? 'Zonder omschrijving'}`,
      hint: row.outcome ? outcomeLabel(row.outcome).toLowerCase() : 'op het bureau',
      to: { name: 'review-dossier', params: { id: row.id } } satisfies RouteLocationRaw,
    })),
    ...inquiries.map((row) => ({
      id: `inquiry:${row.id}`,
      kind: 'RAPPORTAGE' as const,
      label: `#${row.id} · ${row.documentName}`,
      hint: inquiryTypeLabel(row.type),
      to: { name: 'inquiry-view', params: { id: row.id } } satisfies RouteLocationRaw,
    })),
    ...recoveries.map((row) => ({
      id: `recovery:${row.id}`,
      kind: 'HERSTEL' as const,
      label: `#${row.id} · ${row.documentName}`,
      hint: recoveryDocumentTypeLabel(row.type),
      to: { name: 'recovery-view', params: { id: row.id } } satisfies RouteLocationRaw,
    })),
  ]
}
