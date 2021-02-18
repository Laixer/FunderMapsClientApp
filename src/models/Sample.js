
import {
  foundationTypeOptions,
  foundationQualityOptions,
  substructureOptions,
  foundationDamageCauseOptions,
  enforcementTermOptions,
  BaseMeasurementLevelOptions,
  accessOptions
} from 'config/enums'

/**
 * The SampleModel
 */

let structure = {
  id: '',
  report: '',
  foundationType: null,
  foundationQuality: null,
  substructure: null,
  monitoringWell: '',
  cpt: '',
  note: '',
  woodLevel: null,
  groundwaterLeveTemp: null,
  groundLevel: null,
  recoveryAdvised: false,
  foundationDamageCause: null,
  builtYear: '',
  enforcementTerm: null,
  baseMeasurementLevel: null,
  address: null,
  policy: 0,
  createDate: '',
  updateDate: '',
  deleteDate: ''
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
    return foundationDamageCauseOptions[this.damageCause] || null;
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

