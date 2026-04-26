/**
 * The User model — wraps the /api/user/me payload from FunderMapsApi.
 *
 * Field names mirror the canonical TS API shape (snake_case) — the wire
 * format is the source of truth. Don't introduce camelCase aliases here.
 */

import { generateAvatar } from 'utils/namedavatar'

class UserModel {
  constructor({ id, email, given_name, family_name, picture, job_title, phone_number, role, organizations }) {
    this.id = id;
    this.email = email;
    this.given_name = given_name || ''
    this.family_name = family_name || ''
    this.picture = picture || ''
    this.job_title = job_title || ''
    this.phone_number = phone_number || ''
    this.role = role || 'user'
    this.organizations = organizations || []
  }
  // ****************************************************************************
  //  Rights
  // ****************************************************************************
  // TODO: implement
  canReview() {
    return false
  }
  canCreate() {
    return false
  }
  // ****************************************************************************
  //  Username
  // ****************************************************************************
  /**
   * Aim to get the most natural name by which to identify the user
   */
  getUserName() {
    let name = ''
    if (this.given_name) {
      name += this.given_name
    }
    if (this.family_name) {
      name += ' ' + this.family_name
    }
    if (name) {
      return name.trim()
    }
    return this.job_title || 'Me'
  }
  // ****************************************************************************
  //  Avatar
  // ****************************************************************************
  /**
   * Get the avatar image
   */
  getAvatar() {
    if (this.hasAvatar()) {
      return this.picture
    }
    return this.generateAvatar()
  }
  /**
   * Whether the user has uploaded an Avatar
   */
  hasAvatar() {
    return this.picture !== '' && this.picture !== null
  }
  /**
   * Generate a default avatar
   */
  generateAvatar() {
    return generateAvatar({ name: this.getUserName() })
  }
  /**
   * Org role from /api/user/me organizations[0].role.
   * Returns the snake_case string ('superuser'|'verifier'|'writer'|'reader')
   * or '' if the user has no org membership.
   */
  getOrganizationRole() {
    return (this.organizations[0] && this.organizations[0].role) || ''
  }
}

export default UserModel;
