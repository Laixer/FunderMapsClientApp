/**
 * Integer-keyed option lists for sample enum fields. Sourced from the
 * legacy `src/config/enums.js`. Wire format is integer (matching the
 * TS API serializer's enumToInt mapping).
 */

import type { SelectOption } from '@/components/Common/Inputs/Select.vue'

export const SUBSTRUCTURE_OPTIONS: SelectOption[] = [
  { value: 0, label: 'Kelder' },
  { value: 1, label: 'Souterrain' },
  { value: 2, label: 'Kruipruimte' },
  { value: 3, label: 'Geen' },
]

export const FOUNDATION_TYPE_OPTIONS: SelectOption[] = [
  { value: 0, label: 'Hout' },
  { value: 1, label: 'Hout: Amsterdam fundering' },
  { value: 2, label: 'Hout: Rotterdam fundering' },
  { value: 3, label: 'Beton' },
  { value: 4, label: 'Niet onderheid' },
  { value: 5, label: 'Niet onderheid: gemetseld' },
  { value: 6, label: 'Niet onderheid: stroken fundering' },
  { value: 7, label: 'Niet onderheid: fundering met dragen vloer' },
  { value: 8, label: 'Niet onderheid: dragende betonvloer' },
  { value: 9, label: 'Niet onderheid: slieten' },
  { value: 10, label: 'Hout met oplanger' },
  { value: 11, label: 'Verzwaardepuntpaal' },
  { value: 12, label: 'Gecombineerd' },
  { value: 13, label: 'Stalen buispalen' },
  { value: 14, label: 'Overig' },
]

export const ENFORCEMENT_TERM_OPTIONS: SelectOption[] = [
  { value: 0, label: '0-5 jaar' },
  { value: 1, label: '5-10 jaar' },
  { value: 2, label: '10-20 jaar' },
  { value: 3, label: '5 jaar' },
  { value: 4, label: '10 jaar' },
  { value: 5, label: '15 jaar' },
  { value: 6, label: '20 jaar' },
  { value: 7, label: '25 jaar' },
  { value: 8, label: '30 jaar' },
  { value: 9, label: '40 jaar' },
]

export const FOUNDATION_DAMAGE_CAUSE_OPTIONS: SelectOption[] = [
  { value: 0, label: 'Bemaling' },
  { value: 1, label: 'Constructieve fouten' },
  { value: 2, label: 'Droogstand (schimmels)' },
  { value: 3, label: 'Overbelasting' },
  { value: 4, label: 'Overbelasting (negatieve kleef)' },
  { value: 5, label: 'Negatieve kleef' },
  { value: 6, label: 'Bacteriele aantasting' },
  { value: 8, label: 'Schimmel aantasting' },
  { value: 9, label: 'Bacterien en schimmel aantasting' },
  { value: 10, label: 'Funderings fouten' },
  { value: 11, label: 'Afglijden fundering' },
  { value: 12, label: 'Bodemdaling' },
  { value: 13, label: 'Aantasting (planten)wortels' },
  { value: 14, label: 'Gaswinning' },
  { value: 15, label: 'Trillingen' },
  { value: 16, label: 'Funderingsherstel naastgelegen pand' },
  { value: 17, label: 'Japanse duizendknoop' },
]

export const DAMAGE_CHARACTERISTICS_OPTIONS: SelectOption[] = [
  { value: 0, label: 'Klemmende deuren en ramen' },
  { value: 1, label: 'Scheuren' },
  { value: 2, label: 'Scheefstand' },
  { value: 3, label: 'Water in kruipruimte' },
  { value: 4, label: 'Drempel boven maaiveld' },
  { value: 5, label: 'Drempel onder maaiveld' },
  { value: 6, label: 'Scheve vloer of wand' },
]

export const FOUNDATION_QUALITY_OPTIONS: SelectOption[] = [
  { value: 0, label: 'Slecht' },
  { value: 1, label: 'Matig' },
  { value: 2, label: 'Redelijk' },
  { value: 3, label: 'Goed' },
  { value: 4, label: 'Matig tot goed' },
  { value: 5, label: 'Matig tot slecht' },
]

export const QUALITY_OPTIONS: SelectOption[] = [
  { value: 0, label: 'Slecht' },
  { value: 1, label: 'Redelijk' },
  { value: 2, label: 'Goed' },
  { value: 3, label: 'Zeer goed' },
]

export const WOOD_TYPE_OPTIONS: SelectOption[] = [
  { value: 0, label: 'Grenen' },
  { value: 1, label: 'Vuren' },
]

export const WOOD_ENCROACHMENT_OPTIONS: SelectOption[] = [
  { value: 0, label: 'Schimmelaantasting' },
  { value: 1, label: 'Bacteriele- of schimmelaantasting' },
  { value: 2, label: 'Bacteriele aantasting' },
]

export const CRACK_TYPE_OPTIONS: SelectOption[] = [
  { value: 0, label: 'Geen' },
  { value: 1, label: 'Zeer klein' },
  { value: 2, label: 'Klein' },
  { value: 3, label: 'Matig' },
  { value: 4, label: 'Groot' },
]

export const ROTATION_OPTIONS: SelectOption[] = [
  { value: 0, label: 'Nihil' },
  { value: 1, label: 'Klein' },
  { value: 2, label: 'Middelmatig' },
  { value: 3, label: 'Groot' },
  { value: 4, label: 'Zeer groot' },
]

export const FACADE_SCAN_RISK_OPTIONS: SelectOption[] = [
  { value: 0, label: 'A' },
  { value: 1, label: 'B' },
  { value: 2, label: 'C' },
  { value: 3, label: 'D' },
  { value: 4, label: 'E' },
]

export const CONSTRUCTION_PILE_OPTIONS: SelectOption[] = [
  { value: 0, label: 'Hout' },
  { value: 1, label: 'Beton' },
]
