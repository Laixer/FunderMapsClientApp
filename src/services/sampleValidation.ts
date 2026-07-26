/**
 * Cross-field checks on one address, phrased as sentences.
 *
 * Every rule here is about two fields that disagree — the kind of mistake a
 * per-field validator cannot see. A depth of 5 is a perfectly good number; a
 * groundwater level of 5 m NAP under a ground level of 3,4 m NAP means the
 * water is standing above the street, which almost always means someone typed
 * centimetres into a metres field.
 *
 * The output is deliberately prose and deliberately non-blocking. These are
 * *suspicions*, not errors: the Netherlands has genuinely strange buildings in
 * it, and an entry tool that refuses to record what the report says is a tool
 * people work around. Nothing here prevents a save or an submission — it puts a
 * sentence in the right-hand pane and lets a person decide.
 */

import type { IInquirySample } from '@/services/fundermaps/interfaces/IInquirySample'

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

export function findingsFor(sample: IInquirySample): SampleFinding[] {
  const findings: SampleFinding[] = []

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
    pileDiameterBottom > pileDiameterTop
  ) {
    findings.push({
      id: 'pile-widens',
      message: `Paaldiameter onder (${nl(pileDiameterBottom)}) is groter dan boven (${nl(pileDiameterTop)}) — ongebruikelijk voor een geheide paal.`,
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
  if (typeof builtYear === 'string' && builtYear) {
    const year = new Date(builtYear).getFullYear()
    if (Number.isFinite(year) && year > new Date().getFullYear()) {
      findings.push({
        id: 'built-in-future',
        message: `Bouwjaar ${year} ligt in de toekomst.`,
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
