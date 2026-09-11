/**
 * Dutch for everything the review lane shows a person.
 *
 * Identifiers stay English everywhere (column names, enum codes, verdicts,
 * outcomes, channels) -- only what is read on screen is Dutch. Kept out of the
 * view so the tables are one place, cover the "Beoordeeld" panel and the
 * header as well as the open cards, and can be checked without a browser
 * (ClientApp #333, point 1: raw database names were leaking through).
 */

import { INQUIRY_TYPE_CODE_LABELS } from '@/services/inquiryEnums'
import type { SelectOption } from '@/services/options'

/** Keys are `report.inquiry_sample` column names, plus the three document-level fields and `recovery_note`. */
export const FIELD_LABEL: Record<string, string> = {
  // About the document itself: land on report.inquiry, not on a sample.
  document_date: 'Datum rapport',
  inquiry_type: 'Soort document',
  contractor: 'Opsteller (uitvoerder)',
  foundation_type: 'Funderingstype',
  built_year: 'Bouwjaar',
  foundation_quality: 'Funderingskwaliteit',
  recovery_advised: 'Herstel geadviseerd',
  recovery_note: 'Hersteladvies (toelichting)',
  follow_up_note: 'Vervolgadvies (onderzoek / monitoring)',
  enforcement_term: 'Handhavingstermijn',
  groundwater_level: 'Grondwaterstand',
  wood_level: 'Bovenkant hout',
  pile_head_level: 'Bovenkant paal',
  pile_tip_level: 'Paalpuntniveau',
  concrete_charger_length: 'Lengte betonoplanger',
  pile_diameter_top: 'Paaldiameter kop',
  pile_diameter_bottom: 'Paaldiameter punt',
  pile_distance_length: 'Paalafstand (h.o.h.)',
  wood_type: 'Houtsoort',
  wood_penetration_depth: 'Indringingsdiepte hout',
  wood_encroachment: 'Houtaantasting',
  wood_quality: 'Houtkwaliteit',
  wood_capacity_horizontal_quality: 'Houtkwaliteit (horizontaal)',
  carrying_capacity_quality: 'Draagkracht',
  mason_quality: 'Metselwerkkwaliteit',
  mason_level: 'Onderkant metselwerk',
  foundation_depth: 'Aanlegniveau fundering',
  groundlevel: 'Maaiveld',
  cpt: 'Sondering',
  substructure: 'Onderbouw',
  damage_cause: 'Schadeoorzaak',
  damage_characteristics: 'Schadebeeld',
  crack_facade_front_type: 'Scheuren voorgevel',
  crack_facade_back_type: 'Scheuren achtergevel',
  crack_facade_left_type: 'Scheuren linkerzijgevel',
  crack_facade_right_type: 'Scheuren rechterzijgevel',
  crack_indoor_type: 'Scheuren inpandig',
  skewed_parallel: 'Lintvoegmeting',
  skewed_perpendicular: 'Loodmeting',
  skewed_parallel_facade: 'Lintvoegmeting (gevel)',
  skewed_perpendicular_facade: 'Loodmeting (gevel)',
  threshold_front_level: 'Drempelniveau voorzijde',
  threshold_back_level: 'Drempelniveau achterzijde',
  settlement_speed: 'Zakkingssnelheid',
  monitoring_well: 'Peilbuis',
  note: 'Notitie',
}

/** Unit shown next to a value, so -2.324 is read as metres NAP and not millimetres. */
export const FIELD_UNIT: Record<string, string> = {
  groundwater_level: 'm t.o.v. NAP',
  wood_level: 'm t.o.v. NAP',
  pile_head_level: 'm t.o.v. NAP',
  pile_tip_level: 'm t.o.v. NAP',
  concrete_charger_length: 'm',
  pile_diameter_top: 'mm',
  pile_diameter_bottom: 'mm',
  pile_distance_length: 'm',
  wood_penetration_depth: 'mm',
  mason_level: 'm t.o.v. NAP',
  foundation_depth: 'm t.o.v. NAP',
  groundlevel: 'm t.o.v. NAP',
  threshold_front_level: 'm t.o.v. NAP',
  threshold_back_level: 'm t.o.v. NAP',
  settlement_speed: 'mm/jaar',
}

/**
 * Scheefstand is stored as the denominator of a ratio: 300 means 1:300. Don's
 * ruling 2026-09-11 — keep the number, show it as the ratio it is. The old
 * "mm/m" suffix was simply wrong.
 */
const RATIO_FIELDS = new Set(['skewed_parallel', 'skewed_perpendicular'])

/**
 * `report.foundation_type` codes as the pipeline emits them (same vocabulary
 * as FunderMapsWorker `FOUNDATION_VOCABULARY`). The integer-keyed
 * `FOUNDATION_TYPE_OPTIONS` in sampleEnums is the sample editor's wire format;
 * the review lane speaks codes, so a correction picked here must be a code too.
 */
export const FOUNDATION_TYPE_CODE_LABELS: Record<string, string> = {
  wood: 'Hout',
  wood_amsterdam: 'Hout: Amsterdam fundering',
  wood_rotterdam: 'Hout: Rotterdam fundering',
  wood_rotterdam_amsterdam: 'Hout: gecombineerde Rotterdam/Amsterdam fundering',
  wood_amsterdam_arch: 'Hout: Amsterdam fundering met bogen',
  wood_rotterdam_arch: 'Hout: Rotterdam fundering met bogen',
  wood_charger: 'Hout met oplanger',
  concrete: 'Beton',
  steel_pile: 'Stalen buispalen',
  weighted_pile: 'Verzwaardepuntpaal',
  combined: 'Gecombineerd',
  no_pile: 'Niet onderheid',
  no_pile_masonry: 'Niet onderheid: gemetseld',
  no_pile_strips: 'Niet onderheid: stroken fundering',
  no_pile_bearing_floor: 'Niet onderheid: fundering met dragende vloer',
  no_pile_concrete_floor: 'Niet onderheid: dragende betonvloer',
  no_pile_slit: 'Niet onderheid: slieten',
  other: 'Overig',
}

export const FOUNDATION_TYPE_CODE_OPTIONS: SelectOption[] = Object.entries(
  FOUNDATION_TYPE_CODE_LABELS,
).map(([value, label]) => ({ value, label }))

export const INQUIRY_TYPE_CODE_OPTIONS: SelectOption[] = Object.entries(
  INQUIRY_TYPE_CODE_LABELS,
).map(([value, label]) => ({ value, label }))

/** `report.foundation_quality`. The four-step `report.quality` (nil/small/mediocre/large) is a different scale and is left as its code until the pipeline emits it. */
const FOUNDATION_QUALITY: Record<string, string> = {
  bad: 'slecht',
  mediocre: 'matig',
  tolerable: 'redelijk',
  good: 'goed',
  mediocre_good: 'matig tot goed',
  mediocre_bad: 'matig tot slecht',
}

const CRACK: Record<string, string> = {
  none: 'geen',
  nil: 'geen',
  small: 'licht',
  mediocre: 'matig',
  big: 'ernstig',
}

const INFECTION: Record<string, string> = {
  fungus_infection: 'schimmelaantasting',
  bio_infection: 'bacteriële aantasting',
  bio_fungus_infection: 'bacteriële + schimmelaantasting',
}

/** Enum-coded values, shown in Dutch. The code is what gets stored. */
export const VALUE_LABEL: Record<string, Record<string, string>> = {
  inquiry_type: INQUIRY_TYPE_CODE_LABELS,
  foundation_type: FOUNDATION_TYPE_CODE_LABELS,
  foundation_quality: FOUNDATION_QUALITY,
  enforcement_term: {
    term5: '≤ 5 jaar',
    term10: '≤ 10 jaar',
    term15: '≤ 15 jaar',
    term20: '≤ 20 jaar',
    term25: '≤ 25 jaar',
    term30: '≤ 30 jaar',
    term40: '> 30 jaar',
    term05: '0–5 jaar',
    term510: '5–10 jaar',
    term1020: '10–20 jaar',
  },
  recovery_advised: { true: 'ja', false: 'nee' },
  monitoring_well: { true: 'ja', false: 'nee' },
  wood_type: { pine: 'grenen', spruce: 'vuren' },
  substructure: { basement: 'kelder', cellar: 'souterrain', crawlspace: 'kruipruimte', none: 'geen' },
  crack_facade_front_type: CRACK,
  crack_facade_back_type: CRACK,
  crack_facade_left_type: CRACK,
  crack_facade_right_type: CRACK,
  crack_indoor_type: CRACK,
  wood_encroachment: INFECTION,
  damage_cause: {
    drainage: 'ontwatering',
    construction_flaw: 'constructiefout',
    drystand: 'droogstand',
    overcharge: 'overbelasting',
    overcharge_negative_cling: 'overbelasting + negatieve kleef',
    negative_cling: 'negatieve kleef',
    ...INFECTION,
    foundation_flaw: 'funderingsfout',
    construction_heave: 'opdrukken constructie',
    subsidence: 'zetting',
    vegetation: 'begroeiing',
    gas: 'gas',
    vibrations: 'trillingen',
    partial_foundation_recovery: 'gedeeltelijk funderingsherstel',
    japanese_knotweed: 'Japanse duizendknoop',
    groundwater_level_reduction: 'grondwaterstandverlaging',
  },
  damage_characteristics: {
    jamming_door_window: 'klemmende deuren/ramen',
    crack: 'scheuren',
    skewed: 'scheefstand',
    crawlspace_flooding: 'water in kruipruimte',
    threshold_above_subsurface: 'dorpel boven maaiveld',
    threshold_below_subsurface: 'dorpel onder maaiveld',
    crooked_floor_wall: 'scheve vloer/wand',
  },
}

/** What a reviewer decided about one value. */
export const VERDICT_LABEL: Record<string, string> = {
  confirmed: 'overgenomen',
  corrected: 'aangepast',
  rejected: 'afgekeurd',
  agreed: 'komt overeen',
  superseded: 'vervallen',
  pending: 'open',
  auto_accepted: 'open',
}

/** How a dossier was closed. `accepted` covers both a commit and a close without rapportage. */
export const OUTCOME_LABEL: Record<string, string> = {
  accepted: 'afgehandeld',
  rejected: 'afgewezen',
  duplicate: 'als duplicaat gesloten',
  no_data: 'gesloten: geen gegevens',
}

/** Where a dossier came in. */
export const CHANNEL_LABEL: Record<string, string> = {
  upload: 'het meldportaal',
  email: 'e-mail',
  bulk_drop: 'een bulklevering',
  api: 'de API',
  invoer_app: 'de Studio',
  audit: 'een nalezing',
}

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })

/** A proposed or decided value, as a person reads it. */
export function displayValue(field: string, value: string | null | undefined): string {
  if (value == null || value === '') return '—'
  if (field === 'document_date' && /^\d{4}-\d{2}-\d{2}/.test(value)) return formatDate(value)
  if (RATIO_FIELDS.has(field) && /^\d+([.,]\d+)?$/.test(value.trim())) return `1:${value.trim()}`
  return VALUE_LABEL[field]?.[value] ?? value
}

export const fieldLabel = (field: string) => FIELD_LABEL[field] ?? field
