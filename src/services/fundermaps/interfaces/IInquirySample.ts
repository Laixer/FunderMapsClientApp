/**
 * Inquiry sample shape returned by the TS API (camelCase + integer enums).
 * Mirrors the body of `toLegacyInquirySample` in
 * `~/Projects/FunderMapsApi/src/lib/inquiry-serializer.ts`.
 *
 * Most fields are nullable — they're only filled in once the form gets to that
 * sub-step. `address` is the only required field on create/update (it's how the
 * server resolves the building).
 */

export interface IInquirySample {
  id: number
  inquiry: number
  address: string
  building: string
  note: string | null
  builtYear: string | null
  substructure: number | null
  cpt: string | null
  monitoringWell: string | null
  groundwaterLevelTemp: number | null
  groundLevel: number | null
  groundwaterLevelNet: number | null
  foundationType: number | null
  enforcementTerm: number | null
  recoveryAdvised: boolean | null
  damageCause: number | null
  damageCharacteristics: number | null
  constructionPile: number | null
  woodType: number | null
  woodEncroachment: number | null
  constructionLevel: number | null
  woodLevel: number | null
  pileDiameterTop: number | null
  pileDiameterBottom: number | null
  pileHeadLevel: number | null
  pileTipLevel: number | null
  foundationDepth: number | null
  masonLevel: number | null
  concreteChargerLength: number | null
  pileDistanceLength: number | null
  woodPenetrationDepth: number | null
  overallQuality: number | null
  woodQuality: number | null
  constructionQuality: number | null
  woodCapacityHorizontalQuality: number | null
  pileWoodCapacityVerticalQuality: number | null
  carryingCapacityQuality: number | null
  masonQuality: number | null
  woodQualityNecessity: boolean | null
  crackIndoorRestored: boolean | null
  crackIndoorType: number | null
  crackIndoorSize: number | null
  crackFacadeFrontRestored: boolean | null
  crackFacadeFrontType: number | null
  crackFacadeFrontSize: number | null
  crackFacadeBackRestored: boolean | null
  crackFacadeBackType: number | null
  crackFacadeBackSize: number | null
  crackFacadeLeftRestored: boolean | null
  crackFacadeLeftType: number | null
  crackFacadeLeftSize: number | null
  crackFacadeRightRestored: boolean | null
  crackFacadeRightType: number | null
  crackFacadeRightSize: number | null
  deformedFacade: boolean | null
  thresholdUpdownSkewed: boolean | null
  thresholdFrontLevel: number | null
  thresholdBackLevel: number | null
  skewedParallel: number | null
  skewedParallelFacade: number | null
  skewedPerpendicular: number | null
  skewedPerpendicularFacade: number | null
  settlementSpeed: number | null
  skewedWindowFrame: boolean | null
  facadeScanRisk: number | null
  createDate: string | null
  updateDate: string | null
  deleteDate: string | null
}

/** Body for POST/PUT /api/inquiry/{id}/sample. */
export type IInquirySampleInput = Omit<
  IInquirySample,
  'id' | 'inquiry' | 'building' | 'createDate' | 'updateDate' | 'deleteDate'
>
