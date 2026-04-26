import { generateAvatar } from 'utils/namedavatar'

/**
 * Wrapper for an organization-member row from /api/organization/user — i.e. a
 * full /api/user/me-shape user (snake_case) plus the caller's role in the
 * organization (`organization_role` as snake_case string from the PG enum).
 */
class OrgUserModel {
  constructor(user) {
    Object.assign(this, user);
  }
  // ****************************************************************************
  //  User Name
  // ****************************************************************************
  /**
   * Aim to get the most natural name by which to identify the user
   */
  getUserName() {
    let name = '';
    if (this.given_name) {
      name += this.given_name;
    }
    if (this.family_name) {
      name += ' ' + this.family_name;
    }
    if (name) {
      return name.trim();
    }
    return this.email;
  }
  // ****************************************************************************
  //  Role
  // ****************************************************************************
  /**
   * Internal role identifier (English title-case for legacy comparisons).
   */
  getRoleSlug() {
    switch (this.organization_role) {
      case 'superuser':
        return 'Superuser';
      case 'verifier':
        return 'Verifier';
      case 'writer':
        return 'Writer';
      case 'reader':
        return 'Reader';
    }
    return 'Unknown';
  }
  /**
   * Translated (Dutch) role label for UI.
   */
  getRoleName() {
    switch (this.getRoleSlug()) {
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
    return ['Superuser', 'Verifier'].includes(this.getRoleSlug());
  }
  /**
   * Whether or not the user is able to create and edit reports
   */
  canCreate() {
    return ['Superuser', 'Writer'].includes(this.getRoleSlug());
  }
  // ****************************************************************************
  //  Avatar
  // ****************************************************************************
  /**
   * Get the avatar image
   */
  getAvatar() {
    if (this.hasAvatar()) {
      return this.picture;
    }
    return this.generateAvatar();
  }
  /**
   * Whether the user has uploaded an Avatar
   */
  hasAvatar() {
    return this.picture !== '' && this.picture !== null;
  }
  /**
   * Generate a default avatar
   */
  generateAvatar() {
    return generateAvatar({ name: this.getUserName() || '?' });
  }
}

export default OrgUserModel;
