
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
  groundwaterLevel: null,
  groundLevel: null,
  foundationRecoveryAdviced: false,
  foundationDamageCause: null,
  builtYear: '',
  enforcementTerm: null,
  baseMeasurementLevel: null,
  address: {
    id: null,
    streetName: null,
    buildingNumber: null,
    buildingNumberSuffix: null
  },
  policy: 0,
  createDate: '',
  updateDate: '',
  deleteDate: ''
}

class SampleModel {
  constructor({ sample, stored, editorState }) {
    Object.assign(this, structure, sample);
    this.stored = stored;
    this.editorState = editorState || 'close';
  }
  updateValues({ data }) {
    Object.assign(this, structure, data);
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
  getFoundationQuality() {
    return foundationQualityOptions[this.foundationQuality] || null;
  }
  getSubstructure() {
    return substructureOptions[this.substructure] || null;
  }
  getFoundationDamageCause() {
    return foundationDamageCauseOptions[this.foundationDamageCause] || null;
  }
  // Note: returns an object {text, value}
  getEnforcementTerm() {
    return enforcementTermOptions[this.enforcementTerm] || null;
  }
  getBaseMeasurementLevel() {
    return BaseMeasurementLevelOptions[this.baseMeasurementLevel] || null;
  }
  getAccess() {
    return accessOptions[this.policy] || null;
  }
}

export default SampleModel;