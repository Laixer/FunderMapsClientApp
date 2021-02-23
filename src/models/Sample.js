
import {
  foundationTypeOptions,
  foundationQualityOptions,
  substructureOptions,
  damageCauseOptions,
  enforcementTermOptions,
  BaseMeasurementLevelOptions,
  accessOptions
} from 'config/enums'

/**
 * The SampleModel
 */

let structure = {
  id: null,
  inquiry: null,
  address: null,
  builtYear: null,
  carryingCapacityQuality: null,
  concreteChargerLength: null,
  constructionLevel: null,
  constructionPile: null,
  constructionQuality: null,
  cpt: null,
  crackFacadeBackRestored: null,
  crackFacadeBackSize: null,
  crackFacadeBackType: null,
  crackFacadeFrontRestored: null,
  crackFacadeFronSize: null,
  crackFacadeFronType: null,
  crackFacadeLeftRestored: null,
  crackFacadeLeftSize: null,
  crackFacadeLeftType: null,
  crackFacadeRightRestored: null,
  crackFacadeRightSize: null,
  crackFacadeRightType: null,
  crackIndoorRestored: null,
  crackIndoorSize: null,
  crackIndoorType: null,
  createDate: null,
  camageCause: null,
  camageCharacteristics: null,
  ceformedFacadee: null,
  celeteDate: null,
  enforcementTerm: null,
  foundationDepth: null,
  foundationType: null,
  groundLevel: null,
  groundwaterLevelNet: null,
  groundwaterLevelTemp: null,
  masonLevel: null,
  masonQuality: null,
  monitoringWell: null,
  note: null,
  overallQuality: null,
  pileDiameterBottom: null,
  pileDiameterTop: null,
  pileDistanceLength: null,
  pileHeadLevel: null,
  pileTipLevel: null,
  pileWoodCapacityVerticalQuality: null,
  recoveryAdvised: null,
  settlementSpeed: null,
  skewedFacade: null,
  skewedParallel: null,
  skewedPerpendicular: null,
  substructure: null,
  thresholdBackLevel: null,
  thresholdFrontLevel: null,
  thresholdUpdownSkewed: null,
  updateDate: null,
  woodCapacityHorizontalQuality: null,
  woodEncroachement: null,
  woodLevel: null,
  woodPenetrationDepth: null,
  woodQuality: null,
  woodQualityNecessity: null,
  woodType: null,
  skewedWindowFrame: null
}

export default class SampleModel {
  constructor({ sample, stored, editorState }) {
    Object.assign(this, structure);
    Object.assign(this, sample);

    this.stored = stored;
    this.editorState = editorState || 'close';
  }
  updateValues({ data }) {
    Object.assign(this, data);
  }
  // ****************************************************************************
  //  Editor states
  // ****************************************************************************
  openEditor() {
    this.editorState = 'open';
  }
  closeEditor() {
    this.editorState = 'close';
  }
  // ****************************************************************************
  //  Dropdown values
  // ****************************************************************************
  getFoundationType() {
    return foundationTypeOptions[this.foundationType] || null;
  }
  getOverallQuality() {
    return foundationQualityOptions[this.overallQuality] || null;
  }
  getSubstructure() {
    return substructureOptions[this.substructure] || null;
  }
  getFoundationDamageCause() {
    return damageCauseOptions[this.damageCause] || null;
  }
  // Note: returns an object {text, value}
  getEnforcementTerm() {
    return enforcementTermOptions[this.enforcementTerm] || null;
  }
  getBaseMeasurementLevel() {
    // TODO This is a fix
    return BaseMeasurementLevelOptions[0] || null;
  }
  getAccess() {
    return accessOptions[this.policy] || null;
  }
}

