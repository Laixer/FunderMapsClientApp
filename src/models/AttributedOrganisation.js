
/**
 * Just a pretty wrapper for now
 */
let AttributedOrganisation = function (org) {
  Object.assign(this, org);
}

AttributedOrganisation.prototype.getId = function() {
  return this.id;
}

export default AttributedOrganisation;