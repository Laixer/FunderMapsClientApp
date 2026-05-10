/**
 * Recovery-related enum mappings: integer wire values → Dutch labels.
 * The TS API serializes these enums as integers (matching the C# legacy wire
 * format) — see `~/Projects/FunderMapsApi/src/lib/recovery-serializer.ts`.
 */

import type { SelectOption } from '@/components/Common/Inputs/Select.vue'

export { AUDIT_STATUS, STATUS_META, statusMeta } from './inquiryEnums'
export type { AuditStatus, StatusMeta } from './inquiryEnums'

/** Recovery document type integer → Dutch label. */
export const RECOVERY_DOCUMENT_TYPE_LABELS: Record<number, string> = {
  0: 'Vergunning',
  1: 'Funderingsrapport',
  2: 'Archiefrapport',
  3: 'Eigenaarsbewijs',
  4: 'Onbekend',
}

export function recoveryDocumentTypeLabel(type: number | null | undefined): string {
  return RECOVERY_DOCUMENT_TYPE_LABELS[type ?? -1] ?? 'Onbekend'
}

export const RECOVERY_DOCUMENT_TYPE_OPTIONS: SelectOption[] = Object.entries(
  RECOVERY_DOCUMENT_TYPE_LABELS,
).map(([k, label]) => ({ value: Number(k), label }))

export const RECOVERY_TYPE_LABELS: Record<number, string> = {
  0: 'Tafelconstructie',
  1: 'Balk op paal',
  2: 'Paalverlaging',
  3: 'Paal in wand',
  4: 'Injectie',
  5: 'Onbekend',
}

export function recoveryTypeLabel(type: number | null | undefined): string {
  return RECOVERY_TYPE_LABELS[type ?? -1] ?? 'Onbekend'
}

export const RECOVERY_TYPE_OPTIONS: SelectOption[] = Object.entries(
  RECOVERY_TYPE_LABELS,
).map(([k, label]) => ({ value: Number(k), label }))

export const RECOVERY_STATUS_LABELS: Record<number, string> = {
  0: 'Gepland',
  1: 'Aangevraagd',
  2: 'Uitgevoerd',
}

export function recoveryStatusLabel(status: number | null | undefined): string {
  return RECOVERY_STATUS_LABELS[status ?? -1] ?? '-'
}

export const RECOVERY_STATUS_OPTIONS: SelectOption[] = Object.entries(
  RECOVERY_STATUS_LABELS,
).map(([k, label]) => ({ value: Number(k), label }))

export const PILE_TYPE_LABELS: Record<number, string> = {
  0: 'Gepersd',
  1: 'Inwendig geheid',
  2: 'Segment',
}

export function pileTypeLabel(type: number | null | undefined): string {
  return PILE_TYPE_LABELS[type ?? -1] ?? '-'
}

export const PILE_TYPE_OPTIONS: SelectOption[] = Object.entries(PILE_TYPE_LABELS).map(
  ([k, label]) => ({ value: Number(k), label }),
)

export const FACADE_LABELS: Record<number, string> = {
  0: 'Voorgevel',
  1: 'Linkergevel',
  2: 'Rechtergevel',
  3: 'Achtergevel',
}

export const FACADE_OPTIONS: { value: number; label: string }[] = Object.entries(
  FACADE_LABELS,
).map(([k, label]) => ({ value: Number(k), label }))
