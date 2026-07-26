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
import { inquiryTypeLabel } from '@/services/inquiryEnums'
import { NAV_ITEMS } from '@/services/navigation'
import { recoveryDocumentTypeLabel } from '@/services/recoveryEnums'

export type PaletteKind = 'GA NAAR' | 'DOSSIER' | 'HERSTEL' | 'ACTIE'

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

/**
 * Records matching the query, inquiries and recoveries together.
 *
 * Both lookups are allowed to fail independently: the palette losing its
 * recovery results is a smaller problem than the palette showing nothing
 * because one endpoint was slow, and a search box that sometimes returns an
 * error instead of results is a search box people stop using.
 */
export async function recordItems(query: string): Promise<PaletteItem[]> {
  const q = query.trim()
  if (q.length < 2) return []

  const [inquiries, recoveries] = await Promise.all([
    api.inquiry.list({ q, limit: PALETTE_RESULT_LIMIT }).catch(() => []),
    api.recovery.list({ q, limit: 3 }).catch(() => []),
  ])

  return [
    ...inquiries.map((row) => ({
      id: `inquiry:${row.id}`,
      kind: 'DOSSIER' as const,
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
