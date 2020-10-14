import { generateAvatar } from 'utils/namedavatar'

/**
 * Organization model wrapper with basic functionality.
 */
class OrganizationModel {
  constructor(org) {
    Object.assign(this, org);
  }

  /**
   * Get the organization id.
   */
  getId() {
    return this.id;
  }

  /**
   * Generates a default avatar for this organization.
   */
  getAvatar() {
    return generateAvatar({ name: this.name })
  }
}


export default OrganizationModel;