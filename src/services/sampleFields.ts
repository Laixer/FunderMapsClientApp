/**
 * Read-only field descriptors for inquiry samples: every field of the
 * sample form (`components/Inquiry/SampleForm.vue`) with its Dutch label,
 * display kind, and enum options — grouped in the same sections and order
 * as the form. Used to render the reviewer-facing overview (issue #263,
 * item 7); keep in sync when the form gains or loses fields.
 */

import type { SelectOption } from '@/components/Common/Inputs/Select.vue'
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
  label: string
  kind: SampleFieldKind
  options?: SelectOption[]
}

export interface SampleSectionDef {
  title: string
  fields: SampleFieldDef[]
}

export const SAMPLE_SECTIONS: SampleSectionDef[] = [
  {
    title: 'Algemeen',
    fields: [
      { key: 'builtYear', label: 'Bouwjaar', kind: 'date' },
      { key: 'substructure', label: 'Onderbouw', kind: 'enum', options: SUBSTRUCTURE_OPTIONS },
      { key: 'cpt', label: 'Sondering', kind: 'text' },
      { key: 'monitoringWell', label: 'Peilbuis', kind: 'text' },
      { key: 'groundLevel', label: 'Maaiveldhoogte (m NAP)', kind: 'number' },
      {
        key: 'groundwaterLevelTemp',
        label: 'Grondwaterstand tijdens inspectie (m NAP)',
        kind: 'number',
      },
      { key: 'groundwaterLevelNet', label: 'Grondwaterstand (m NAP)', kind: 'number' },
      {
        key: 'recoveryAdvised',
        label: 'Hersteladvies / funderingsherstel noodzakelijk',
        kind: 'bool',
      },
    ],
  },
  {
    title: 'Fundering',
    fields: [
      { key: 'foundationType', label: 'Funderingstype', kind: 'enum', options: FOUNDATION_TYPE_OPTIONS },
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
        label: 'Onderkant constructie (opbouw op fundering)',
        kind: 'number',
      },
      { key: 'woodLevel', label: 'Bovenkant funderingshout (m NAP)', kind: 'number' },
      {
        key: 'foundationDepth',
        label: 'Onderkant fundering (m NAP), alleen bij niet-onderheide fundering',
        kind: 'number',
      },
      { key: 'masonLevel', label: 'Onderkant metselwerk (m NAP)', kind: 'number' },
      { key: 'pileDiameterTop', label: 'Paaldiameter top', kind: 'number' },
      { key: 'pileDiameterBottom', label: 'Paaldiameter onder', kind: 'number' },
      { key: 'pileHeadLevel', label: 'Paalkop niveau', kind: 'number' },
      { key: 'pileTipLevel', label: 'Paalpunt niveau', kind: 'number' },
      { key: 'concreteChargerLength', label: 'Lengte betonoplanger (m)', kind: 'number' },
      { key: 'pileDistanceLength', label: 'Paalafstand', kind: 'number' },
      { key: 'woodPenetrationDepth', label: 'Indringingswaarde (mm)', kind: 'number' },
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
    fields: [
      { key: 'crackIndoorType', label: 'Inpandige scheur', kind: 'enum', options: CRACK_TYPE_OPTIONS },
      { key: 'crackIndoorSize', label: 'Inpandige scheur — grootte (mm)', kind: 'number' },
      { key: 'crackIndoorRestored', label: 'Inpandige scheur — hersteld', kind: 'bool' },
      {
        key: 'crackFacadeFrontType',
        label: 'Voorgevel scheur',
        kind: 'enum',
        options: CRACK_TYPE_OPTIONS,
      },
      { key: 'crackFacadeFrontSize', label: 'Voorgevel scheur — grootte (mm)', kind: 'number' },
      { key: 'crackFacadeFrontRestored', label: 'Voorgevel scheur — hersteld', kind: 'bool' },
      {
        key: 'crackFacadeBackType',
        label: 'Achtergevel scheur',
        kind: 'enum',
        options: CRACK_TYPE_OPTIONS,
      },
      { key: 'crackFacadeBackSize', label: 'Achtergevel scheur — grootte (mm)', kind: 'number' },
      { key: 'crackFacadeBackRestored', label: 'Achtergevel scheur — hersteld', kind: 'bool' },
      {
        key: 'crackFacadeLeftType',
        label: 'Linkergevel scheur',
        kind: 'enum',
        options: CRACK_TYPE_OPTIONS,
      },
      { key: 'crackFacadeLeftSize', label: 'Linkergevel scheur — grootte (mm)', kind: 'number' },
      { key: 'crackFacadeLeftRestored', label: 'Linkergevel scheur — hersteld', kind: 'bool' },
      {
        key: 'crackFacadeRightType',
        label: 'Rechtergevel scheur',
        kind: 'enum',
        options: CRACK_TYPE_OPTIONS,
      },
      { key: 'crackFacadeRightSize', label: 'Rechtergevel scheur — grootte (mm)', kind: 'number' },
      { key: 'crackFacadeRightRestored', label: 'Rechtergevel scheur — hersteld', kind: 'bool' },
    ],
  },
  {
    title: 'Vervorming',
    fields: [
      { key: 'deformedFacade', label: 'Gevelvervorming aanwezig', kind: 'bool' },
      { key: 'thresholdUpdownSkewed', label: 'Scheefstand onder-/bovendorpel aanwezig', kind: 'bool' },
      { key: 'thresholdFrontLevel', label: 'Drempelniveau voorzijde (m NAP)', kind: 'number' },
      { key: 'thresholdBackLevel', label: 'Drempelniveau achterzijde (m NAP)', kind: 'number' },
      { key: 'skewedParallel', label: 'Lintvoegmeting (mm/m)', kind: 'number' },
      {
        key: 'skewedParallelFacade',
        label: 'Lintvoegmeting beoordeling',
        kind: 'enum',
        options: ROTATION_OPTIONS,
      },
      { key: 'skewedPerpendicular', label: 'Loodmeting (mm/m)', kind: 'number' },
      {
        key: 'skewedPerpendicularFacade',
        label: 'Loodmeting beoordeling',
        kind: 'enum',
        options: ROTATION_OPTIONS,
      },
      { key: 'settlementSpeed', label: 'Zakkingssnelheid (mm/jaar)', kind: 'number' },
      { key: 'skewedWindowFrame', label: 'Scheve kozijnen', kind: 'bool' },
      {
        key: 'facadeScanRisk',
        label: 'Risicoklasse QuickScan / Fase 0',
        kind: 'enum',
        options: FACADE_SCAN_RISK_OPTIONS,
      },
    ],
  },
]

/** A field counts as filled when it has an actual value; `false` is a value. */
export function isSampleFieldFilled(value: unknown): boolean {
  return value !== null && value !== undefined && value !== ''
}

/** Number of filled form fields on a sample (note included). */
export function countFilledSampleFields(sample: IInquirySample): number {
  const fields = SAMPLE_SECTIONS.flatMap((s) => s.fields).filter((f) =>
    isSampleFieldFilled(sample[f.key]),
  ).length
  return fields + (sample.note ? 1 : 0)
}
