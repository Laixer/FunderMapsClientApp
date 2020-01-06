
import { generateAvatar } from 'utils/namedavatar'

/**
 * Just a pretty wrapper for now
 */
class OrgUserModel {
  constructor(user) {
    Object.assign(this, user.profile, { role: user.role });
  }
  // ****************************************************************************
  //  User Name
  // ****************************************************************************
  /**
   * Aim to get the most natural name by which to identify the user
   */
  getUserName() {
    // First try given and/or last name
    let name = '';
    if (this.givenName) {
      name += this.givenName;
    }
    if (this.lastName) {
      name += ' ' + this.lastName;
    }
    if (name) {
      return name.trim();
    }
    // Resort to email
    return this.email;
  }
  // ****************************************************************************
  //  Role
  // ****************************************************************************
  getRoleSlug() {
    switch (this.role) {
      case 0:
        return 'Superuser';
      case 1:
        return 'Verifier';
      case 2:
        return 'Writer';
      case 3:
        return 'Reader';
    }
    return 'Unknown';
  }
  /**
   * The translated role name
   */
  getRoleName() {
    switch (this.getRoleSlug()) {
      case 'Admin':
        return 'Admin';
      case 'Superuser':
        return 'Beheerder';
      case 'Verifier':
        return 'Reviewer';
      case 'Writer':
        return 'Verwerker';
      case 'Reader':
        return 'Alleen lezen';
    }
    return 'Unknown';
  }
  /**
   * Whether or not the user is able to approve / disapprove reports
   */
  canReview() {
    return ['Admin', 'Superuser', 'Reviewer'].includes(this.getRoleSlug());
  }
  /**
   * Whether or not the user is able to create and edit reports
   */
  canCreate() {
    return ['Admin', 'Superuser', 'Creator'].includes(this.getRoleSlug());
  }
  // ****************************************************************************
  //  Avatar
  // ****************************************************************************
  /**
   * Get the avatar image
   */
  getAvatar() {
    if (this.hasAvatar()) {
      return this.avatar;
    }
    return this.generateAvatar();
  }
  /**
   * Whether the user has uploaded an Avatar
   */
  hasAvatar() {
    return this.avatar !== '' && this.avatar !== null;
  }
  /**
   * Generate a default avatar
   */
  generateAvatar() {
    return generateAvatar({ name: this.getUserName() || '?' }); // TODO: This should not be the fix
  }
}

export default OrgUserModel;
