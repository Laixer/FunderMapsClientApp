/**
 * Checks on one address, phrased as sentences.
 *
 * Two kinds live here. Most are about two fields that disagree — the kind of
 * mistake a per-field validator cannot see. A depth of 5 is a perfectly good
 * number; a groundwater level of 5 m NAP under a ground level of 3,4 m NAP
 * means the water is standing above the street, which almost always means
 * someone typed centimetres into a metres field.
 *
 * The rest are about the *kind of report* the address sits in: a funderings-
 * onderzoek that never measured anything, an archiefonderzoek carrying values
 * nobody could have observed from an archive. Those read the inquiry type, so
 * they only fire where the type is known.
 *
 * The output is deliberately prose and deliberately non-blocking. These are
 * *suspicions*, not errors: the Netherlands has genuinely strange buildings in
 * it, and an entry tool that refuses to record what the report says is a tool
 * people work around. Nothing here prevents a save or an submission — it puts a
 * sentence in the right-hand pane and lets a person decide.
 */

import type { IInquirySample } from '@/services/fundermaps/interfaces/IInquirySample'
import { INQUIRY_TYPE } from '@/services/inquiryEnums'
import { isSampleFieldFilled } from '@/services/sampleFields'

export interface SampleFinding {
  id: string
  /** One sentence: what disagrees, with both values, and what to check. */
  message: string
}

/** Dutch decimal comma, because every other number on the screen has one. */
function nl(value: number): string {
  return value.toLocaleString('nl-NL', { maximumFractionDigits: 2 })
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

/** `a, b en c` — a list a person can read out loud. */
function enumerate(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? ''
  return `${parts.slice(0, -1).join(', ')} en ${parts[parts.length - 1]}`
}

/* ------------------------------------------------- rules per inquiry type */

/**
 * One "onderdeel" as the rules talk about it: a name, and the field or fields
 * that record it. A part counts as filled when *any* of its keys carries a
 * value — a lintvoegmeting is present whether the entry holds the measured
 * mm/m, the assessment, or both.
 */
interface SamplePart {
  /** Reads mid-sentence, so lower case unless the term itself is capitalised. */
  label: string
  keys: ReadonlyArray<keyof IInquirySample>
}

const PART = {
  enforcementTerm: { label: 'handhavingstermijn', keys: ['enforcementTerm'] },
  overallQuality: { label: 'algehele funderingskwaliteit', keys: ['overallQuality'] },
  woodLevel: { label: 'bovenkant funderingshout', keys: ['woodLevel'] },
  skewedParallel: {
    label: 'lintvoegmeting',
    keys: ['skewedParallel', 'skewedParallelFacade'],
  },
  skewedPerpendicular: {
    label: 'loodmeting',
    keys: ['skewedPerpendicular', 'skewedPerpendicularFacade'],
  },
  // "Geen" is one of the crack types, so an address without a single crack
  // field is an unanswered question rather than a building without cracks.
  // `restored` is left out on purpose: it says what happened to a crack, not
  // that one was looked for.
  cracks: {
    label: 'scheurregistratie',
    keys: [
      'crackIndoorType',
      'crackIndoorSize',
      'crackFacadeFrontType',
      'crackFacadeFrontSize',
      'crackFacadeBackType',
      'crackFacadeBackSize',
      'crackFacadeLeftType',
      'crackFacadeLeftSize',
      'crackFacadeRightType',
      'crackFacadeRightSize',
    ],
  },
  facadeScan: { label: 'risicoklasse QuickScan / Fase 0', keys: ['facadeScanRisk'] },
} as const satisfies Record<string, SamplePart>

function isPartFilled(sample: IInquirySample, part: SamplePart): boolean {
  return part.keys.some((key) => isSampleFieldFilled(sample[key]))
}

/**
 * The id every field in the rule appears in, because `SampleForm` hangs a
 * finding on a field by looking for the field's key inside the finding's id —
 * so one sentence about three missing parts lights up all three controls.
 */
function partsId(prefix: string, parts: SamplePart[]): string {
  return [prefix, ...parts.flatMap((p) => p.keys)].join('-')
}

/**
 * Rules Don wrote down for the two report types where "which fields belong
 * here" is not a matter of taste:
 *
 *  1. a funderingsonderzoek states a handhavingstermijn, an algehele
 *     funderingskwaliteit and a bovenkant funderingshout;
 *  2. it also carries the inspection itself — lintvoeg, lood, scheuren;
 *  3. an archiefonderzoek carries none of gevelscan, algehele kwaliteit or
 *     handhavingstermijn, because nobody stood in front of the building.
 *
 * Each rule is one sentence rather than one per field: three callouts saying
 * "ontbreekt" is a wall, and the reviewer needs the rule, not the tally.
 */
function typeFindings(sample: IInquirySample, inquiryType: number): SampleFinding[] {
  const findings: SampleFinding[] = []

  if (inquiryType === INQUIRY_TYPE.FOUNDATION_RESEARCH) {
    const required = [PART.enforcementTerm, PART.overallQuality, PART.woodLevel]
    const missing = required.filter((part) => !isPartFilled(sample, part))
    if (missing.length) {
      findings.push({
        id: partsId('foundation-research-missing', missing),
        message: `Funderingsonderzoek: ${enumerate(missing.map((p) => p.label))} niet ingevuld — ${
          missing.length === 1 ? 'dat onderdeel hoort' : 'die onderdelen horen'
        } bij dit onderzoekstype vastgelegd te zijn.`,
      })
    }

    const inspection = [PART.skewedParallel, PART.skewedPerpendicular, PART.cracks]
    const missingInspection = inspection.filter((part) => !isPartFilled(sample, part))
    if (missingInspection.length) {
      findings.push({
        id: partsId('foundation-research-missing-inspection', missingInspection),
        message: `Funderingsonderzoek: ${enumerate(missingInspection.map((p) => p.label))} ontbreekt — de inspectiegegevens horen bij dit onderzoekstype vastgelegd te zijn.`,
      })
    }
  }

  if (inquiryType === INQUIRY_TYPE.ARCHIVE_RESEARCH) {
    const forbidden = [PART.facadeScan, PART.overallQuality, PART.enforcementTerm]
    const present = forbidden.filter((part) => isPartFilled(sample, part))
    if (present.length) {
      findings.push({
        id: partsId('archive-research-unexpected', present),
        message: `Archiefonderzoek: ${enumerate(present.map((p) => p.label))} ingevuld — ${
          present.length === 1 ? 'dat onderdeel komt' : 'die onderdelen komen'
        } niet uit een archiefonderzoek, controleer het onderzoekstype.`,
      })
    }
  }

  return findings
}

/**
 * Wooden piles taper: the head is the wide end. Only a concrete pile with an
 * enlarged tip (verzwaardepuntpaal) is legitimately wider at the bottom, so
 * the "pile widens downward" suspicion is raised for wood alone — Yorick's
 * ruling, 2026-08-22. Values are `FOUNDATION_TYPE_OPTIONS` in sampleEnums:
 * Hout, Hout: Amsterdam, Hout: Rotterdam, Hout met oplanger.
 */
const WOOD_PILE_TYPES: ReadonlySet<number> = new Set([0, 1, 2, 10])

/**
 * @param inquiryType the dossier's type, when the caller knows it. Left out,
 *   the per-type rules simply do not run — a finding needs a fact behind it.
 * @param documentDate the dossier's document date, for the bouwjaar rule.
 */
export function findingsFor(
  sample: IInquirySample,
  inquiryType?: number | null,
  documentDate?: string | null,
): SampleFinding[] {
  const findings: SampleFinding[] =
    inquiryType === null || inquiryType === undefined ? [] : typeFindings(sample, inquiryType)

  const {
    groundLevel,
    groundwaterLevelNet,
    groundwaterLevelTemp,
    woodLevel,
    pileHeadLevel,
    pileTipLevel,
    pileDiameterTop,
    pileDiameterBottom,
    recoveryAdvised,
    damageCause,
    foundationType,
    builtYear,
    settlementSpeed,
  } = sample

  if (isNumber(groundLevel) && isNumber(groundwaterLevelNet) && groundwaterLevelNet > groundLevel) {
    findings.push({
      id: 'groundwater-above-ground',
      message: `Grondwaterstand (${nl(groundwaterLevelNet)} m NAP) ligt boven maaiveldhoogte (${nl(groundLevel)} m NAP) — controleer de eenheid.`,
    })
  }

  if (
    isNumber(groundLevel) &&
    isNumber(groundwaterLevelTemp) &&
    groundwaterLevelTemp > groundLevel
  ) {
    findings.push({
      id: 'groundwater-temp-above-ground',
      message: `Grondwaterstand tijdens inspectie (${nl(groundwaterLevelTemp)} m NAP) ligt boven maaiveldhoogte (${nl(groundLevel)} m NAP).`,
    })
  }

  if (isNumber(groundLevel) && isNumber(woodLevel) && woodLevel > groundLevel) {
    findings.push({
      id: 'wood-above-ground',
      message: `Bovenkant funderingshout (${nl(woodLevel)} m NAP) ligt boven maaiveld (${nl(groundLevel)} m NAP) — dat kan niet kloppen.`,
    })
  }

  if (isNumber(pileHeadLevel) && isNumber(pileTipLevel) && pileTipLevel > pileHeadLevel) {
    findings.push({
      id: 'tip-above-head',
      message: `Paalpunt (${nl(pileTipLevel)} m NAP) ligt boven de paalkop (${nl(pileHeadLevel)} m NAP) — waarschijnlijk zijn de twee verwisseld.`,
    })
  }

  if (
    isNumber(pileDiameterTop) &&
    isNumber(pileDiameterBottom) &&
    pileDiameterBottom > pileDiameterTop &&
    isNumber(foundationType) &&
    WOOD_PILE_TYPES.has(foundationType)
  ) {
    findings.push({
      id: 'pile-widens',
      message: `Paaldiameter onder (${nl(pileDiameterBottom)}) is groter dan boven (${nl(pileDiameterTop)}) — bij een houten paal is de kop het brede eind; alleen een betonpaal met verzwaarde punt is onderaan breder.`,
    })
  }

  // Zakking is entered negative (mm/jaar ≤ 0) — the API and the database
  // refuse a positive value, so say so here before the save bounces.
  if (isNumber(settlementSpeed) && settlementSpeed > 0) {
    findings.push({
      id: 'settlementSpeed-positive',
      message: `Zakkingssnelheid ${nl(settlementSpeed)} mm/jaar is positief — zakking wordt negatief ingevoerd (−${nl(settlementSpeed)}).`,
    })
  }

  if (recoveryAdvised === true && damageCause === null) {
    findings.push({
      id: 'advice-without-cause',
      message: 'Er is funderingsherstel geadviseerd, maar er is geen schade-oorzaak ingevuld.',
    })
  }

  // Crack sizes and crack types travel in pairs; one without the other is
  // almost always a half-finished row rather than a deliberate omission.
  const CRACKS = [
    ['Inpandige scheur', sample.crackIndoorType, sample.crackIndoorSize],
    ['Voorgevel scheur', sample.crackFacadeFrontType, sample.crackFacadeFrontSize],
    ['Achtergevel scheur', sample.crackFacadeBackType, sample.crackFacadeBackSize],
    ['Linkergevel scheur', sample.crackFacadeLeftType, sample.crackFacadeLeftSize],
    ['Rechtergevel scheur', sample.crackFacadeRightType, sample.crackFacadeRightSize],
  ] as const

  for (const [label, type, size] of CRACKS) {
    if (isNumber(size) && size > 0 && type === null) {
      findings.push({
        id: `crack-size-without-type-${label}`,
        message: `${label}: er is een grootte ingevuld maar geen type.`,
      })
    }
  }

  // `builtYear` is a date column carrying a construction year; a building from
  // after the document was written is a typo, not a time machine.
  //
  // It is only filled when the document states the year — otherwise it stays
  // empty and the BAG year applies. The audit found thousands of rows where the
  // report's own date had been typed in, so a match with the document year is
  // called out: sometimes true, usually the wrong number.
  if (typeof builtYear === 'string' && builtYear) {
    const year = new Date(builtYear).getFullYear()
    if (Number.isFinite(year) && year > new Date().getFullYear()) {
      findings.push({
        id: 'builtYear-in-future',
        message: `Bouwjaar ${year} ligt in de toekomst.`,
      })
    }
    const documentYear = documentDate ? new Date(documentDate).getFullYear() : NaN
    if (Number.isFinite(year) && Number.isFinite(documentYear) && year === documentYear) {
      findings.push({
        id: 'builtYear-is-document-year',
        message: `Bouwjaar ${year} is gelijk aan het jaar van het rapport — alleen invullen als het document het bouwjaar noemt; anders leeg laten, dan geldt het BAG-bouwjaar.`,
      })
    }
  }

  if (foundationType === null && sample.enforcementTerm !== null) {
    findings.push({
      id: 'term-without-type',
      message: 'Er is een handhavingstermijn ingevuld zonder funderingstype.',
    })
  }

  return findings
}
