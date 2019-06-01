
import AttributedUser from 'model/AttributedUser'

import { typeOptions, statusOptions, accessOptions } from 'config/enums'

/**
 * The Report model
 */
let reportModel = function ({
  id, document_id, document_date, status, type,
  attribution, document_name, floor_measurement, 
  inspection, joint_measurement, norm, note, access_policy
  // update_date, create_date, delete_date
}) {
  if ( ! id ) {
    throw "Missing identifier";
  }
  if ( ! document_id) {
    throw "Missing document_id";
  }
  if ( ! document_date) {
    throw "Missing document_date";
  }

  // The database id
  this.id = id;

  // The document reference provided by the user (the label)
  this.document_id = document_id;

  // Formatted as '2019-05-23T19:17:39.804Z', which parse accepts
  this.document_date = new Date(document_date);

  // Status of process
  this.status = status && statusOptions[status] 
    ? statusOptions[status]
    : 'Invalid';

  // Type of report 
  this.type = type && typeOptions[type]
    ? typeOptions[type]
    : null

  // Is the report public or private?
  this.access_policy = access_policy && accessOptions[access_policy]
    ? accessOptions[accessOptions]
    : 'Invalid'

  // Samples are set / added / removed 
  this.samples = [];

  // attribution, 
  this.creator = attribution && attribution.creator 
    ? new AttributedUser(attribution.creator, 'Uitvoerder')
    : null;
  this.reviewer = attribution && attribution.reviewer
    ? new AttributedUser(attribution.reviewer, 'Reviewer')
    : null;
  //  contractor, owner: orgs
  //  project & project_navigation: ?

  // Direct input
  Object.assign(this, {
    document_name, floor_measurement, 
    inspection, joint_measurement, norm, note
  })
}

/**
 * Document ID / Label
 */
reportModel.prototype.label = function() {
  return this.document_id;
}

/**
 * Formatted date
 */
reportModel.prototype.date = function() {
  return this.document_date.getDate() + " - " +
    this.document_date.getMonth() + " - " +
    this.document_date.getFullYear();
}

/**
 * Status
 */
reportModel.prototype.statusColor = function() {
  return (this.status && this.status.bgColor)
    ? this.status.bgColor
    : '';
}

/**
 * Attribution
 */
reportModel.prototype.reviewerName = function() {
  if (this.reviewer !== null) {
    return this.reviewer.getUserName()
  }

  return 'Onbekend';
}

/**
 * Type
 */
reportModel.prototype.hasType = function() {
  return this.type !== null;
}
reportModel.prototype.getType = function() {
  return this.type
}


/**
 * Samples
 */
reportModel.prototype.setSamples = function({ samples }) {
  this.samples = samples
}
reportModel.prototype.addSample = function({ sample }) {
  this.samples.push(sample)
}
reportModel.prototype.removeSampleById = function({ id }) {
  let index = this.samples.findIndex(record => {
    return record.id === id
  })
  this.samples.splice(index, 1);
}


export default reportModel;