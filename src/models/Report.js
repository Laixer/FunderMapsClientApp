
import AttributedUser from 'model/AttributedUser'

import { typeOptions, statusOptions, accessOptions } from 'config/enums'
import AttributedOrganisation from './AttributedOrganisation'

/**
 * The Report model
 */
class reportModel {
  constructor({
    id, documentId, documentDate, status, type,
    attribution, documentName, floorMeasurement,
    inspection, jointMeasurement, norm, note, accessPolicy,
    updateDate, createDate, deleteDate }) {

    if (!id) {
      throw "Missing identifier";
    }
    if (!documentId) {
      throw "Missing documentId";
    }
    if (!documentDate) {
      throw "Missing documentDate";
    }

    // The database id
    this.id = id;
    // The document reference provided by the user (the label)
    this.documentId = documentId;
    // Formatted as '2019-05-23T19:17:39.804Z', which parse accepts
    this.documentDate = new Date(documentDate);
    // Status of process
    this.setStatus({ status });
    // Type of report 
    this.type = typeOptions[type] ? typeOptions[type] : null;
    this.typeNumber = type;
    // Is the report public or private?
    this.accessPolicy = accessOptions[accessPolicy] ? accessOptions[accessPolicy] : 'Invalid';
    // Samples are set / added / removed 
    this.samples = [];
    // attribution, 
    let user = attribution && attribution.creator ? attribution.creator : null;
    if (typeof user === 'string') {
      user = {
        id: user
      };
    }
    this.creator = user
      ? new AttributedUser({ user, role: 'Verwerker' })
      : null;
    user = attribution && attribution.reviewer ? attribution.reviewer : null;
    if (typeof user === 'string') {
      user = {
        id: user
      };
    }
    this.reviewer = user ? new AttributedUser({ user, role: 'Reviewer' }) : null;

    let orgContractor = attribution && attribution.contractor ? attribution.contractor : null;
    if (typeof orgContractor === 'string') {
      this.contractor = new AttributedOrganisation(orgContractor, 'Uitvoerder');
    }

    let orgOwner = attribution && attribution.owner ? attribution.owner : null;
    if (typeof orgOwner === 'string') {
      this.owner = new AttributedOrganisation(orgOwner, 'Eigenaar');
    }

    // Direct input
    Object.assign(this, {
      documentName, floorMeasurement,
      inspection, jointMeasurement, norm, note,
      updateDate, createDate, deleteDate
    });
  }
  /**
   * Document ID / Label
   */
  label() {
    return this.documentId;
  }
  /**
   * Formatted date
   */
  date() {
    return this.documentDate.getDate() + " - " +
      this.documentDate.getMonth() + " - " +
      this.documentDate.getFullYear();
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
  setStatus({ status }) {
    this.status = statusOptions[status]
      ? statusOptions[status]
      : 'Invalid';
    this.statusNumber = status;
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
  isPendingReview() {
    return 'PendingReview' === this.status.text;
  }
  isAvailableForReview() {
    return ['PendingReview', 'Done', 'Rejected'].includes(this.status.text);
  }
  /**
   * Attribution
   */
  reviewerName() {
    if (this.reviewer !== null) {
      return this.reviewer.getUserName();
    }
    return 'Onbekend';
  }
  /**
   * Type
   */
  hasType() {
    return this.type !== null;
  }
  getType() {
    return this.type;
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

export default reportModel;
