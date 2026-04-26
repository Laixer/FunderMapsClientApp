/**
 * Inquiry-related enum mappings: integer wire values → Dutch labels.
 * The TS API serializes these enums as integers (matching the C# legacy wire
 * format) — see `~/Projects/FunderMapsApi/src/lib/inquiry-serializer.ts`.
 */

/** Audit status codes per the inquiry state machine. */
export const AUDIT_STATUS = {
  TODO: 0,
  PENDING: 1,
  DONE: 2,
  DISCARDED: 3,
  PENDING_REVIEW: 4,
  REJECTED: 5,
} as const

export type AuditStatus = (typeof AUDIT_STATUS)[keyof typeof AUDIT_STATUS]

export interface StatusMeta {
  label: string
  /** Tailwind classes for the status pill (bg + text). */
  classes: string
}

export const STATUS_META: Record<number, StatusMeta> = {
  0: { label: 'Nog te beoordelen', classes: 'bg-grey-200 text-grey-800' },
  1: { label: 'In bewerking', classes: 'bg-yellow-100 text-grey-800' },
  2: { label: 'Afgerond', classes: 'bg-green-100 text-green-800' },
  3: { label: 'Afgevallen', classes: 'bg-grey-200 text-grey-700' },
  4: { label: 'Gecontroleerd', classes: 'bg-blue-100 text-blue-900' },
  5: { label: 'Afgekeurd', classes: 'bg-red-50 text-red-800' },
}

export function statusMeta(status: number | null | undefined): StatusMeta {
  return STATUS_META[status ?? -1] ?? { label: 'Onbekend', classes: 'bg-grey-200 text-grey-800' }
}

/** Inquiry type integer → Dutch label. From legacy `config/enums.js typeOptions`. */
export const INQUIRY_TYPE_LABELS: Record<number, string> = {
  0: 'Aanvullend onderzoek',
  1: 'Monitoring',
  2: 'Notitie',
  3: 'QuickScan (vervallen)',
  4: 'Onbekend',
  5: 'Sloopgrens onderzoek',
  6: 'Second opinion',
  7: 'Archief onderzoek',
  8: 'Bouwkundig onderzoek',
  9: 'Funderingsadvies',
  10: 'Inspectieput',
  11: 'Funderings onderzoek',
  12: 'Grondwater onderzoek',
  13: 'Grondonderzoek',
  14: 'QuickScan (addendum)',
}

export function inquiryTypeLabel(type: number | null | undefined): string {
  return INQUIRY_TYPE_LABELS[type ?? -1] ?? 'Onbekend'
}
