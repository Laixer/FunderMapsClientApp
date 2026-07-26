/**
 * Field descriptors for inquiry samples: every field of the sample form with
 * its Dutch label, display kind, unit, enum options and input constraints —
 * grouped in the same sections and order the form renders them.
 *
 * This is the single definition of "what a sample looks like". Four things
 * render from it: the editable form (`components/Inquiry/SampleForm.vue`, via
 * `SampleField.vue`), the reviewer-facing overview, the read-only detail, and
 * the completeness counts on the dossier page. Add a field here and it appears
 * in all four — there is no second list to keep in sync.
 *
 * Units are a separate property rather than part of the label because the form
 * renders them *inside* the control, on the right, so that a column of depths
 * stays aligned on its digits. The read-only views, which have no control to
 * put a suffix in, append `unit` to the label instead.
 */

import type { SelectOption } from '@/services/options'
import type { IInquirySample } from '@/services/fundermaps/interfaces/IInquirySample'
import {
  SUBSTRUCTURE_OPTIONS,
  FOUNDATION_TYPE_OPTIONS,
  ENFORCEMENT_TERM_OPTIONS,
  FOUNDATION_DAMAGE_CAUSE_OPTIONS,
  DAMAGE_CHARACTERISTICS_OPTIONS,
  FOUNDATION_QUALITY_OPTIONS,
  QUALITY_OPTIONS,
  WOOD_TYPE_OPTIONS,
  WOOD_ENCROACHMENT_OPTIONS,
  CRACK_TYPE_OPTIONS,
  ROTATION_OPTIONS,
  FACADE_SCAN_RISK_OPTIONS,
  CONSTRUCTION_PILE_OPTIONS,
} from '@/services/sampleEnums'

export type SampleFieldKind = 'text' | 'number' | 'bool' | 'enum' | 'date'

export interface SampleFieldDef {
  key: keyof IInquirySample
  /**
   * Standalone label. Carries enough context to be read on its own, because
   * the overview and read-only views list fields without their section
   * grouping — hence "Voorgevel scheur — grootte" rather than "Grootte".
   */
  label: string
  /**
   * Label to use inside the form, where the surrounding section already
   * supplies the context. Falls back to `label` when absent.
   */
  shortLabel?: string
  kind: SampleFieldKind
  /** Rendered inside the control as a suffix: `m NAP`, `mm`, `mm/jaar`. */
  unit?: string
  options?: SelectOption[]
  /** A sentence under the control, for a field whose meaning is not obvious. */
  hint?: string
  /** Native number-input constraints. Only meaningful for `kind: 'number'`. */
  min?: number
  max?: number
  step?: number
}

export interface SampleSectionDef {
  title: string
  /**
   * Column count for the form grid. `3` is used by sections whose fields come
   * in fixed triplets (crack: type / size / restored). Defaults to `2`.
   */
  columns?: 2 | 3
  fields: SampleFieldDef[]
}

/**
 * A height in metres relative to NAP. Negative is ordinary — most of the
 * Netherlands sits below sea level.
 */
const LEVEL = { kind: 'number', unit: 'm NAP', min: -999.99, max: 999.99, step: 0.01 } as const

/** A physical length or diameter, so never negative. */
const MEASURE = { kind: 'number', min: 0, max: 999.99, step: 0.01 } as const

export const SAMPLE_SECTIONS: SampleSectionDef[] = [
  {
    title: 'Algemeen',
    fields: [
      { key: 'builtYear', label: 'Bouwjaar', kind: 'date' },
      { key: 'substructure', label: 'Onderbouw', kind: 'enum', options: SUBSTRUCTURE_OPTIONS },
      { key: 'cpt', label: 'Sondering', kind: 'text' },
      { key: 'monitoringWell', label: 'Peilbuis', kind: 'text' },
      { key: 'groundLevel', label: 'Maaiveldhoogte', ...LEVEL },
      {
        key: 'groundwaterLevelTemp',
        label: 'Grondwaterstand tijdens inspectie',
        shortLabel: 'Grondwater bij inspectie',
        ...LEVEL,
      },
      { key: 'groundwaterLevelNet', label: 'Grondwaterstand', ...LEVEL },
      {
        key: 'recoveryAdvised',
        label: 'Hersteladvies / funderingsherstel noodzakelijk',
        shortLabel: 'Herstel geadviseerd',
        kind: 'bool',
      },
    ],
  },
  {
    title: 'Fundering',
    fields: [
      {
        key: 'foundationType',
        label: 'Funderingstype',
        kind: 'enum',
        options: FOUNDATION_TYPE_OPTIONS,
      },
      {
        key: 'enforcementTerm',
        label: 'Handhavingstermijn',
        kind: 'enum',
        options: ENFORCEMENT_TERM_OPTIONS,
      },
      {
        key: 'damageCause',
        label: 'Schade-oorzaak',
        kind: 'enum',
        options: FOUNDATION_DAMAGE_CAUSE_OPTIONS,
      },
      {
        key: 'damageCharacteristics',
        label: 'Waargenomen schadebeeld',
        kind: 'enum',
        options: DAMAGE_CHARACTERISTICS_OPTIONS,
      },
      {
        key: 'constructionPile',
        label: 'Type funderingsbalk',
        kind: 'enum',
        options: CONSTRUCTION_PILE_OPTIONS,
      },
      { key: 'woodType', label: 'Houtsoort paal', kind: 'enum', options: WOOD_TYPE_OPTIONS },
      {
        key: 'woodEncroachment',
        label: 'Type houtaantasting',
        kind: 'enum',
        options: WOOD_ENCROACHMENT_OPTIONS,
      },
      {
        key: 'constructionLevel',
        label: 'Onderkant constructie',
        hint: 'opbouw op de fundering',
        ...LEVEL,
      },
      { key: 'woodLevel', label: 'Bovenkant funderingshout', ...LEVEL },
      {
        key: 'foundationDepth',
        label: 'Onderkant fundering',
        hint: 'alleen bij een niet-onderheide fundering',
        ...LEVEL,
      },
      { key: 'masonLevel', label: 'Onderkant metselwerk', ...LEVEL },
      { key: 'pileDiameterTop', label: 'Paaldiameter top', unit: 'mm', ...MEASURE },
      { key: 'pileDiameterBottom', label: 'Paaldiameter onder', unit: 'mm', ...MEASURE },
      { key: 'pileHeadLevel', label: 'Paalkop niveau', ...LEVEL },
      { key: 'pileTipLevel', label: 'Paalpunt niveau', ...LEVEL },
      { key: 'concreteChargerLength', label: 'Lengte betonoplanger', unit: 'm', ...MEASURE },
      { key: 'pileDistanceLength', label: 'Paalafstand', unit: 'm', ...MEASURE },
      { key: 'woodPenetrationDepth', label: 'Indringingswaarde', unit: 'mm', ...MEASURE },
    ],
  },
  {
    title: 'Kwaliteit',
    fields: [
      {
        key: 'overallQuality',
        label: 'Algehele funderingskwaliteit',
        kind: 'enum',
        options: FOUNDATION_QUALITY_OPTIONS,
      },
      { key: 'woodQuality', label: 'Kwaliteit hout', kind: 'enum', options: QUALITY_OPTIONS },
      {
        key: 'constructionQuality',
        label: 'Stabiliteit funderingsconstructie',
        kind: 'enum',
        options: QUALITY_OPTIONS,
      },
      {
        key: 'woodCapacityHorizontalQuality',
        label: 'Draagkracht horizontaal funderingshout',
        kind: 'enum',
        options: QUALITY_OPTIONS,
      },
      {
        key: 'pileWoodCapacityVerticalQuality',
        label: 'Draagkracht paalhout',
        kind: 'enum',
        options: QUALITY_OPTIONS,
      },
      {
        key: 'carryingCapacityQuality',
        label: 'Geotechnische draagkracht',
        kind: 'enum',
        options: QUALITY_OPTIONS,
      },
      { key: 'masonQuality', label: 'Metselwerkkwaliteit', kind: 'enum', options: QUALITY_OPTIONS },
      { key: 'woodQualityNecessity', label: 'Houtonderzoek nodig', kind: 'bool' },
    ],
  },
  {
    title: 'Scheuren',
    columns: 3,
    fields: [
      {
        key: 'crackIndoorType',
        label: 'Inpandige scheur',
        kind: 'enum',
        options: CRACK_TYPE_OPTIONS,
      },
      {
        key: 'crackIndoorSize',
        label: 'Inpandige scheur — grootte',
        shortLabel: 'Grootte',
        kind: 'number',
        unit: 'mm',
      },
      {
        key: 'crackIndoorRestored',
        label: 'Inpandige scheur — hersteld',
        shortLabel: 'Hersteld',
        kind: 'bool',
      },
      {
        key: 'crackFacadeFrontType',
        label: 'Voorgevel scheur',
        kind: 'enum',
        options: CRACK_TYPE_OPTIONS,
      },
      {
        key: 'crackFacadeFrontSize',
        label: 'Voorgevel scheur — grootte',
        shortLabel: 'Grootte',
        kind: 'number',
        unit: 'mm',
      },
      {
        key: 'crackFacadeFrontRestored',
        label: 'Voorgevel scheur — hersteld',
        shortLabel: 'Hersteld',
        kind: 'bool',
      },
      {
        key: 'crackFacadeBackType',
        label: 'Achtergevel scheur',
        kind: 'enum',
        options: CRACK_TYPE_OPTIONS,
      },
      {
        key: 'crackFacadeBackSize',
        label: 'Achtergevel scheur — grootte',
        shortLabel: 'Grootte',
        kind: 'number',
        unit: 'mm',
      },
      {
        key: 'crackFacadeBackRestored',
        label: 'Achtergevel scheur — hersteld',
        shortLabel: 'Hersteld',
        kind: 'bool',
      },
      {
        key: 'crackFacadeLeftType',
        label: 'Linkergevel scheur',
        kind: 'enum',
        options: CRACK_TYPE_OPTIONS,
      },
      {
        key: 'crackFacadeLeftSize',
        label: 'Linkergevel scheur — grootte',
        shortLabel: 'Grootte',
        kind: 'number',
        unit: 'mm',
      },
      {
        key: 'crackFacadeLeftRestored',
        label: 'Linkergevel scheur — hersteld',
        shortLabel: 'Hersteld',
        kind: 'bool',
      },
      {
        key: 'crackFacadeRightType',
        label: 'Rechtergevel scheur',
        kind: 'enum',
        options: CRACK_TYPE_OPTIONS,
      },
      {
        key: 'crackFacadeRightSize',
        label: 'Rechtergevel scheur — grootte',
        shortLabel: 'Grootte',
        kind: 'number',
        unit: 'mm',
      },
      {
        key: 'crackFacadeRightRestored',
        label: 'Rechtergevel scheur — hersteld',
        shortLabel: 'Hersteld',
        kind: 'bool',
      },
    ],
  },
  {
    title: 'Vervorming',
    fields: [
      { key: 'deformedFacade', label: 'Gevelvervorming aanwezig', kind: 'bool' },
      {
        key: 'thresholdUpdownSkewed',
        label: 'Scheefstand onder-/bovendorpel aanwezig',
        shortLabel: 'Scheefstand dorpel',
        kind: 'bool',
      },
      { key: 'thresholdFrontLevel', label: 'Drempelniveau voorzijde', ...LEVEL },
      { key: 'thresholdBackLevel', label: 'Drempelniveau achterzijde', ...LEVEL },
      { key: 'skewedParallel', label: 'Lintvoegmeting', unit: 'mm/m', ...MEASURE },
      {
        key: 'skewedParallelFacade',
        label: 'Lintvoegmeting beoordeling',
        kind: 'enum',
        options: ROTATION_OPTIONS,
      },
      { key: 'skewedPerpendicular', label: 'Loodmeting', unit: 'mm/m', ...MEASURE },
      {
        key: 'skewedPerpendicularFacade',
        label: 'Loodmeting beoordeling',
        kind: 'enum',
        options: ROTATION_OPTIONS,
      },
      { key: 'settlementSpeed', label: 'Zakkingssnelheid', kind: 'number', unit: 'mm/jaar', step: 0.01 },
      { key: 'skewedWindowFrame', label: 'Scheve kozijnen', kind: 'bool' },
      {
        key: 'facadeScanRisk',
        label: 'Risicoklasse QuickScan / Fase 0',
        shortLabel: 'Risicoklasse',
        kind: 'enum',
        options: FACADE_SCAN_RISK_OPTIONS,
      },
    ],
  },
]

/**
 * Every field on a sample, flattened. The denominator behind "44 / 58 velden"
 * and the per-address completeness bars — derived from the registry rather than
 * written down, so it cannot fall out of step with the form.
 */
export const ALL_SAMPLE_FIELDS: readonly SampleFieldDef[] = SAMPLE_SECTIONS.flatMap((s) => s.fields)

/** `+ 1` for the note, which lives outside the registry but is still a field. */
export const SAMPLE_FIELD_COUNT = ALL_SAMPLE_FIELDS.length + 1

/** Label plus unit, for the read-only views that have no control to hang a suffix in. */
export function fullLabel(field: SampleFieldDef): string {
  return field.unit ? `${field.label} (${field.unit})` : field.label
}

/** A field counts as filled when it has an actual value; `false` is a value. */
export function isSampleFieldFilled(value: unknown): boolean {
  return value !== null && value !== undefined && value !== ''
}

/** Number of filled form fields on a sample (note included). */
export function countFilledSampleFields(sample: IInquirySample): number {
  const fields = ALL_SAMPLE_FIELDS.filter((f) => isSampleFieldFilled(sample[f.key])).length
  return fields + (sample.note ? 1 : 0)
}

/** How many of a section's fields carry a value — the `x van y gevuld` meta. */
export function countFilledInSection(sample: IInquirySample, section: SampleSectionDef): number {
  return section.fields.filter((f) => isSampleFieldFilled(sample[f.key])).length
}

/** How complete one address is, 0–1 — what the progress bars are drawn from. */
export function sampleCompleteness(sample: IInquirySample): number {
  return countFilledSampleFields(sample) / SAMPLE_FIELD_COUNT
}
