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
import { ALL_SAMPLE_FIELDS } from '@/services/sampleFields'

/**
 * The names of the fields the entry form does not have: the three that describe
 * the document itself (they land on report.inquiry, not on a sample), the two
 * advice texts that end up in the note, and the note. Every other field takes
 * its name from the form's registry (`sampleFields.ts`), so a value is called
 * the same before and after it is taken over. Until 2026-10-13 this table named
 * all 46 of them, and 26 read differently here than in the form ("Maaiveld" /
 * "Maaiveldhoogte", "Aanlegniveau fundering" / "Onderkant fundering").
 */
const LANE_FIELD_LABEL = new Map([
  ['document_date', 'Datum rapport'],
  ['inquiry_type', 'Soort document'],
  ['contractor', 'Opsteller (uitvoerder)'],
  ['recovery_note', 'Hersteladvies (toelichting)'],
  ['follow_up_note', 'Vervolgadvies (onderzoek / monitoring)'],
  ['note', 'Notitie'],
])

/**
 * The two fields the commit writes under another name than their own (API
 * dataops-commit.ts, `applyField`): the form's field is where the value lands,
 * so that is the name the reviewer has to see. "Grondwaterstand" is the name
 * of another field in the form.
 */
const FORM_KEY = new Map([
  ['foundation_quality', 'overallQuality'],
  ['groundwater_level', 'groundwaterLevelTemp'],
])

/** A key without its spelling: `groundlevel`, `ground_level` and `groundLevel` are one field. */
const bareKey = (key: string) => key.replace(/_/g, '').toLowerCase()

const FORM_FIELD_LABEL = new Map(ALL_SAMPLE_FIELDS.map((f) => [bareKey(f.key), f.label]))

const formLabel = (field: string) => FORM_FIELD_LABEL.get(bareKey(FORM_KEY.get(field) ?? field))

/** Whether the lane has a name for this field key (its own, or the form's). */
export const isKnownField = (field: string) => LANE_FIELD_LABEL.has(field) || formLabel(field) !== undefined

/**
 * A field's name on screen. The form's standalone label, not its short one:
 * the cards list fields without the form's sections around them.
 */
export const fieldLabel = (field: string) => LANE_FIELD_LABEL.get(field) ?? formLabel(field) ?? field

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
  no_pile_strips: 'Niet onderheid: strokenfundering',
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

/**
 * What the melder's label becomes as an inquiry type. Mirrors
 * TYPE_FROM_CATEGORY in the API's dataops-commit.ts: keep the two in step.
 */
/**
 * The same choices in the words the melder saw on the upload form (the melden
 * site's ATTACHMENT_CATEGORIES: keep the two in step). The hint under "Soort
 * rapport" used to print the stored code: "(label 'archieveresearch')".
 */
const CATEGORY_LABEL: Record<string, string> = {
  archieveresearch: 'Bouwtekening / archiefstuk',
  foundationresearch: 'Funderingsonderzoek (Fase 1 of 2)',
  quickscan: 'QuickScan / Fase 0',
  herstelbewijs: 'Bewijs van funderingsherstel',
  foto: 'Foto’s van de woning',
  overig: 'Anders / weet ik niet',
}

const TYPE_FROM_CATEGORY: Record<string, string> = {
  foundationresearch: 'foundation_research',
  archieveresearch: 'archive_research',
  quickscan: 'quickscan',
  herstelbewijs: 'note',
  foto: 'note',
  overig: 'note',
}

/**
 * The inquiry type the commit will pick when the reviewer leaves Soort empty
 * and nothing was taken over from the document: the melder's label, else a
 * text-lane document counts as a funderingsonderzoek and anything else as
 * archiefonderzoek. Same rule as the API (ClientApp #338, point 1: the hint
 * used to say "afgeleid van het label" without saying what that gives).
 */
export function derivedInquiryType(category: string | null | undefined, lane: string | null | undefined): {
  code: string
  from: string
} {
  const fromLabel = category ? TYPE_FROM_CATEGORY[category] : undefined
  if (fromLabel) return { code: fromLabel, from: `de melder koos “${CATEGORY_LABEL[category!] ?? category}”` }
  return {
    code: lane === 'text' ? 'foundation_research' : 'archive_research',
    from: category ? `de melder koos “${category}”, dat kennen we niet` : 'de melder koos geen soort',
  }
}

/** `report.foundation_quality`. The four-step `report.quality` (nil/small/mediocre/large) is a different scale and is left as its code until the pipeline emits it. */
const FOUNDATION_QUALITY: Record<string, string> = {
  bad: 'slecht',
  mediocre: 'matig',
  tolerable: 'redelijk',
  good: 'goed',
  mediocre_good: 'matig tot goed',
  mediocre_bad: 'matig tot slecht',
}

// The words of the entry form (sampleEnums.ts, CRACK_TYPE_OPTIONS). `nil` read
// "geen" here as well, so the list offered "geen" twice.
const CRACK: Record<string, string> = {
  none: 'geen',
  nil: 'zeer klein',
  small: 'klein',
  mediocre: 'matig',
  big: 'groot',
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
    foundation_flaw: 'funderingstechnische schade',
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

/**
 * Number fields without a unit of their own: a year, and the n of a 1:n ratio.
 * (The two levels are in FIELD_UNIT as well; the list is the one "Waarde
 * toevoegen" has always used.)
 */
const NUMBER_FIELDS = new Set(['built_year', 'skewed_parallel', 'skewed_perpendicular', 'foundation_depth', 'groundlevel'])

export type ValueKind = 'select' | 'number' | 'text'

/**
 * The control a value of this field is entered with: a list for a coded field
 * (yes/no is one), a number box for a measurement, text for the rest. One rule
 * for "Waarde toevoegen" and for "Andere waarde" on a proposal: the second was
 * a text box for every field, so "ja" was stored as false, "1,25" as 1, and a
 * code could be mistyped.
 */
export function valueKind(field: string | null | undefined): ValueKind {
  if (!field) return 'text'
  if (VALUE_LABEL[field]) return 'select'
  if (FIELD_UNIT[field] || NUMBER_FIELDS.has(field)) return 'number'
  return 'text'
}

/** The choices of a coded field; the code is the value, as the commit expects it. */
export function valueOptions(field: string | null | undefined): SelectOption[] {
  const map = field ? VALUE_LABEL[field] : undefined
  return map ? Object.entries(map).map(([value, label]) => ({ value, label })) : []
}

/** What goes under the number box: the unit, or how a ratio is written. */
export function valueHint(field: string | null | undefined): string | undefined {
  if (!field) return undefined
  return FIELD_UNIT[field] ?? (RATIO_FIELDS.has(field) ? 'Het getal achter 1:, bijvoorbeeld 300' : undefined)
}

/**
 * A text from the modules that sort a melding's files (`rapportageGroups.ts`,
 * `inquiryVerdicts.ts`), in the lane's own words. Their sentences and option
 * labels still say "inquiry"; on screen it is a rapportage, as everywhere else
 * in the Studio (2026-10-13). Only until those two modules say so themselves.
 */
export const inLaneWords = (text: string) =>
  text.replace(/\b(I|i)nquir(y|ies)\b/g, (_, first: string, end: string) => `${first === 'I' ? 'R' : 'r'}apportage${end === 'y' ? '' : 's'}`)

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

/** `<field> = <first word of the value>`, as it is written into a Verloop line. */
const FIELD_VALUE_PAIR = /\b([a-z][a-z0-9]*(?:_[a-z0-9]+)*) = (\S+)?/

/** "(was confirmed)" at the end of a line: only the state words we have a Dutch word for. */
const WAS_STATE = new RegExp(` \\(was (${Object.keys({ ...VERDICT_LABEL, ...OUTCOME_LABEL }).join('|')})\\)$`)

/**
 * A Verloop line as a person reads it.
 *
 * The line is stored with the database's own names ("Waarde overgenomen:
 * foundation_type = wood_charger", "Beoordeling heropend: … (was confirmed)"),
 * because the API writes the field key and the code it was given. Shown here
 * with the names the cards use: "Funderingstype: Hout met oplanger", "(was
 * overgenomen)". Only a pair whose field the lane knows is touched, and of the
 * value only a code, date or number it can read; a name, a sentence or a note
 * after it stays exactly as it was written.
 */
export function readableEntry(text: string): string {
  const pair = FIELD_VALUE_PAIR.exec(text)
  if (!pair || !isKnownField(pair[1]!)) return text
  const field = pair[1]!
  // "wood_charger)" or "1929," at the end of a clause: the mark is not part of the value.
  const [, word = '', mark = ''] = /^(.*?)([),;.]*)$/.exec(pair[2] ?? '') ?? []
  const shown = word ? displayValue(field, word) : ''
  const unit = FIELD_UNIT[field] && /^-?\d+([.,]\d+)?$/.test(word) ? ` ${FIELD_UNIT[field]}` : ''
  // The state a reopened value had, said as the "Beoordeeld" list says it.
  const rest = text
    .slice(pair.index + pair[0].length)
    .replace(WAS_STATE, (_, state: string) => ` (was ${VERDICT_LABEL[state] ?? OUTCOME_LABEL[state]})`)
  return `${text.slice(0, pair.index)}${fieldLabel(field)}: ${shown}${unit}${mark}${rest}`
}
