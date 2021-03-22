
import AttributedUser from 'model/AttributedUser'

import { typeOptions, statusOptions, accessOptions } from 'config/enums'
import AttributedOrganisation from './AttributedOrganisation'

/**
 * The Report model
 */
class ReportModel {
  constructor({
    id,
    documentName,
    inspection,
    jointMeasurement,
    floorMeasurement,
    note,
    documentDate,
    documentFile,
    type,
    standardF3o,
    auditStatus,
    reviewer,
    contractor,
    creator,
    owner,
    accessPolicy,
    createDate,
    updateDate
  }) {
    if (!id) {
      throw "Missing identifier";
    }
    if (!documentName) {
      throw "Missing documentName";
    }
    if (!documentDate) {
      throw "Missing documentDate";
    }

    this.id = id;
    this.documentName = documentName;
    this.inspection = inspection;
    this.jointMeasurement = jointMeasurement;
    this.floorMeasurement = floorMeasurement;
    this.note = note;
    this.documentDate = new Date(documentDate);
    this.documentFile = documentFile;
    this.type = type;
    this.standardF3o = standardF3o;

    // Attribution
    this.reviewerId = reviewer;
    this.contractorId = contractor;
    this.creatorId = creator;
    this.ownerId = owner;

    this.accessPolicy = accessOptions[accessPolicy] ? accessOptions[accessPolicy] : 'Invalid';
    this.createDate = new Date(createDate);
    this.updateDate = updateDate ? new Date(updateDate) : null;


    // Samples are set / added / removed 
    this.samples = [];

    // Status of process
    this.setStatus({ auditStatus });

    // TODO There is no attribution returned by the new API
    // Attribution 
    // let user = attribution && attribution.creator ? attribution.creator : null;
    // if (typeof user === 'string') {
    //   user = {
    //     id: user
    //   };
    // }
    // this.creator = user
    //   ? new AttributedUser({ user, role: 'Verwerker' })
    //   : null;
    // user = attribution && attribution.reviewer ? attribution.reviewer : null;
    // if (typeof user === 'string') {
    //   user = {
    //     id: user
    //   };
    // }

    // TODO Made user null, this might break stuff
    this.reviewer = new AttributedUser({ undefined, role: 'Reviewer' });

    // let orgContractor = attribution && attribution.contractor ? attribution.contractor : null;
    // if (typeof orgContractor === 'string') {
    //   this.contractor = new AttributedOrganisation(orgContractor, 'Uitvoerder');
    // }

    // let orgOwner = attribution && attribution.owner ? attribution.owner : null;
    // if (typeof orgOwner === 'string') {
    //   this.owner = new AttributedOrganisation(orgOwner, 'Eigenaar');
    // }
  }
  /**
   * Document ID / Label
   */
  label() {
    return this.documentName;
  }
  labelShort() {
    return this.documentName.length > 40
      ? `${this.documentName.substring(0, 40)}...`
      : this.documentName;
  }
  /**
   * Formatted date
   */
  date() {
    return this.documentDate.toLocaleDateString('nl-NL', { year: 'numeric', month: 'short', day: 'numeric' })
  }
  /**
   * Status
   */
  statusColor() {
    return (this.status && this.status.bgColor)
      ? this.status.bgColor
      : '';
  }
  /**
   * Set or change status
   */
  setStatus({ auditStatus }) {
    this.status = statusOptions[auditStatus]
      ? statusOptions[auditStatus]
      : 'Invalid';
    this.statusNumber = auditStatus;
  }

  getApprovalState() {
    if ('Done' === this.status.text) {
      return true;
    }
    if ('Rejected' === this.status.text) {
      return false;
    }
    return null;
  }
  isRejected() {
    return 'Rejected' === this.status.text;
  }
  isApproved() {
    return 'Done' === this.status.text;
  }
  isPending() {
    return 'Pending' === this.status.text;
  }
  isPendingReview() {
    return 'PendingReview' === this.status.text;
  }
  isAvailableForReview() {
    return ['PendingReview'].includes(this.status.text);
  }

  /**
   * This function can be used to determine if a user is allowed
   * to edit this report. This function safeguards the audit
   * status state machine.
   */
  isEditable() {
    return ['Todo', 'Pending', 'Rejected'].includes(this.status.text);
  }

  /**
   * Attribution
   */
  reviewerName() {
    if (this.reviewer !== null && this.reviewer !== undefined) {
      return this.reviewer.getUserName();
    }
    return 'Onbekend';
  }
  /**
   * Type
   */
  hasType() {
    return this.type !== null && this.type !== undefined;
  }
  getType() {
    return typeOptions[this.type];
  }
  /**
   * Samples
   */
  setSamples({ samples }) {
    this.samples = samples;
  }
  addSample({ sample }) {
    this.samples.push(sample);
  }
  removeSampleById({ id }) {
    let index = this.samples.findIndex(record => {
      return record.id === id;
    });
    this.samples.splice(index, 1);
  }
}

export default ReportModel;
