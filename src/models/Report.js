
import AttributedUser from 'model/AttributedUser'

import { typeOptions, statusOptions, accessOptions } from 'config/enums'
import AttributedOrganisation from './AttributedOrganisation'

/**
 * The Report model
 */
class reportModel {
  constructor({
    id, document_id, document_date, status, type,
    attribution, document_name, floor_measurement, 
    inspection, joint_measurement, norm, note, access_policy,
    update_date, create_date, delete_date }) {
    
    if (!id) {
      throw "Missing identifier";
    }
    if (!document_id) {
      throw "Missing document_id";
    }
    if (!document_date) {
      throw "Missing document_date";
    }
    
    // The database id
    this.id = id;
    // The document reference provided by the user (the label)
    this.document_id = document_id;
    // Formatted as '2019-05-23T19:17:39.804Z', which parse accepts
    this.document_date = new Date(document_date);
    // Status of process
    this.setStatus({ status });
    // Type of report 
    this.type = typeOptions[type] ? typeOptions[type] : null;
    this.typeNumber = type;
    // Is the report public or private?
    this.access_policy = accessOptions[access_policy] ? accessOptions[access_policy] : 'Invalid';
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
      orgContractor = {
        id: orgContractor
      };
    }
    this.contractor = orgContractor ? new AttributedOrganisation({ orgContractor, role: 'Uitvoerder' }) : null;
  
    let orgOwner = attribution && attribution.owner ? attribution.owner : null;
    if (typeof orgOwner === 'string') {
      orgOwner = {
        id: orgOwner
      };
    }
    this.owner = orgOwner ? new AttributedOrganisation({ orgOwner, role: 'Eigenaar' }) : null;

    // Direct input
    Object.assign(this, {
      document_name, floor_measurement,
      inspection, joint_measurement, norm, note,
      update_date, create_date, delete_date
    });
  }
  /**
   * Document ID / Label
   */
  label() {
    return this.document_id;
  }
  /**
   * Formatted date
   */
  date() {
    return this.document_date.getDate() + " - " +
      this.document_date.getMonth() + " - " +
      this.document_date.getFullYear();
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