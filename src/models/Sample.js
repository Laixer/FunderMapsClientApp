import {
  foundationTypeOptions,
  foundationQualityOptions,
  substructureOptions,
  foundationDamageCauseOptions,
  enforcementTermOptions,
  damageCharacteristicsOptions,
  accessOptions,
  woodTypeOptions,
  woodQuality,
  sizeOptions,
  qualityOptions,
  foundationBarOptions,
  foundationGroupImages,
  rotationOptions,
  crackTypeOptions
} from "config/enums";

/**
 * The SampleModel
 */

let structure = {
  // id: "",
  // report: "",
  // foundationType: null,
  // foundationQuality: null,
  // substructure: null,
  // monitoringWell: "",
  // cpt: "",
  // note: "",
  // woodLevel: null,
  // groundwaterLeveTemp: null,
  // groundLevel: null,
  // recoveryAdvised: false,
  // foundationDamageCause: null,
  // builtYear: "",
  // enforcementTerm: null,
  address: null,
  // addressFormatted: null,
  // policy: 0,
  // createDate: "",
  // updateDate: "",
  // deleteDate: "",
  // formattedAddress: null,
};

export default class SampleModel {
  constructor({ sample, stored, editorState }) {
    Object.assign(this, structure, sample);
    this.stored = stored;
    this.editorState = editorState || "close";
  }
  updateValues({ data }) {
    Object.assign(this, data);
  }
  // ****************************************************************************
  //  Editor states
  // ****************************************************************************
  openEditor() {
    this.editorState = "open";
  }
  closeEditor() {
    this.editorState = "close";
  }
  // ****************************************************************************
  //  Dropdown values
  // ****************************************************************************
  getFoundationType() {
    return foundationTypeOptions[this.foundationType] || null;
  }
  getFoundationTypeImage() {
    const option = foundationTypeOptions[this.foundationType] || null;

    if (!option) return false;

    if (option.group == "wood") {
      return {
        icon: "foundation-wooden-poles.svg",
        text: "Houten palen",
      };
    } else if (option.group == "woodCharger") {
      {
        return {
          icon: "foundation-wooden-poles-2.svg",
          text: "Houten palen oplanger",
        };
      }
    } else if (option.group == "concrete") {
      return {
        icon: "foundation-concrete-poles.svg",
        text: "Betonnen palen",
      };
    } else if (option.group == "none") {
      return {
        icon: "foundation-none.svg",
        text: "Niet onderheid",
      };
    }
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
  getcarryingCapacityQuality() {
    return qualityOptions[this.carryingCapacityQuality] || null;
  }
  getMasonQuality() {
    return qualityOptions[this.masonQuality] || null;
  }
  getConstructionQuality() {
    return qualityOptions[this.constructionQuality] || null;
  }
  getPileWoodCapacityVerticalQuality() {
    return sizeOptions[this.pileWoodCapacityVerticalQuality] || null;
  }
  getFoundationBar() {
    return foundationBarOptions[this.foundationBar] || null;
  }
  getWoodCapacityHorizontalQuality() {
    return sizeOptions[this.woodCapacityHorizontalQuality] || null;
  }
  getWoodEncroachement() {
    return sizeOptions[this.woodEncroachement] || null;
  }
  // Note: returns an object {text, value}
  getEnforcementTerm() {
    return enforcementTermOptions[this.enforcementTerm] || null;
  }
  getdamageCharacteristics() {
    return damageCharacteristicsOptions[this.damageCharacteristics] || null;
  }
  getWoodType() {
    return woodTypeOptions[this.woodType] || null;
  }
  getWoodQuality() {
    return qualityOptions[this.woodQuality] || null;
  }
  getAccess() {
    return accessOptions[this.policy] || null;
  }
  getCrackIndoorType() {
    return crackTypeOptions[this.crackIndoorType] || null;
  }
  getCrackFacadeFrontType() {
    return crackTypeOptions[this.crackFacadeFrontType] || null;
  }
  getCrackFacadeBackType() {
    return crackTypeOptions[this.crackFacadeBackType] || null;
  }
  getCrackFacadeLeftType() {
    return crackTypeOptions[this.crackFacadeLeftType] || null;
  }
  getCrackFacadeRightType() {
    return crackTypeOptions[this.crackFacadeRightType] || null;
  }
  getSkewedPerpendicularFacade() {
    return rotationOptions[this.skewedPerpendicularFacade] || null;
  }
  getSkewedParallelFacade() {
    return rotationOptions[this.skewedParallelFacade] || null;
  }
}
