
/**
 * Just a pretty wrapper for now
 */
class OrganizationModel {
  constructor(org) {
    Object.assign(this, org);
  }
  getId() {
    return this.id;
  }
}


export default OrganizationModel;