
/**
 * Just a pretty wrapper for now
 */
let OrganizationModel = function (org) {
  Object.assign(this, org);
}

OrganizationModel.prototype.getId = function() {
  return this.id;
}

export default OrganizationModel;