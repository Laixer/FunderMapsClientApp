
import AttributedUser from 'model/AttributedUser'

import { typeOptions, statusOptions, accessOptions } from 'config/enums'

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
    updateDate,
    attribution,
    access,
    state
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
    if (attribution) {
      this.reviewerId = attribution.reviewer;
      this.contractorId = attribution.contractor;
      this.creatorId = attribution.creator;
      this.ownerId = attribution.owner;
    } else {
      this.reviewerId = reviewer;
      this.contractorId = contractor;
      this.creatorId = creator;
      this.ownerId = owner;
    }

    this.createDate = new Date(createDate);
    this.updateDate = updateDate ? new Date(updateDate) : null;

    if (accessPolicy) {
      this.accessPolicy = accessOptions[accessPolicy] ? accessOptions[accessPolicy] : 'Invalid';
    } else if (access) {
      this.accessPolicy = accessOptions[access.accessPolicy] ? accessOptions[access.accessPolicy] : 'Invalid';
    }

    // Samples are set / added / removed 
    this.samples = [];

    // Status of process
    if (auditStatus) {
      this.setStatus({ auditStatus });
    } else if (state) {
      let auditStatus = state.auditStatus;
      this.setStatus({ auditStatus });
    }

    // TODO Made user null, this might break stuff
    this.reviewer = new AttributedUser({ undefined, role: 'Reviewer' });
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
