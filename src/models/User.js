
/**
 * The User model - contains the profile information of the active user
 * 
 * Note: look at the OrgUser model for the (profile) information superusers 
 *       and admins can access regarding other users.
 */

import { generateAvatar } from 'utils/namedavatar'

class UserModel {
  constructor({ givenName, lastName, avatar, jobTitle, phoneNumber }) {
    this.givenName = givenName || ''
    this.lastName = lastName || ''
    this.avatar = avatar || ''
    this.jobTitle = jobTitle || ''
    this.phoneNumber = phoneNumber || ''
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
    // First try given and/or last name
    let name = ''
    if (this.givenName) {
      name += this.givenName
    }
    if (this.last_name) {
      name += ' ' + this.lastName
    }
    if (name) {
      return name.trim()
    }
    // ...
    return this.jobTitle || 'Me'
  }
  // ****************************************************************************
  //  Avatar
  // ****************************************************************************
  /**
   * Get the avatar image
   */
  getAvatar() {
    if (this.hasAvatar()) {
      return this.avatar
    }
    return this.generateAvatar()
  }
  /**
   * Whether the user has uploaded an Avatar
   */
  hasAvatar() {
    return this.avatar !== '' && this.avatar !== null
  }
  /**
   * Generate a default avatar
   */
  generateAvatar() {
    return generateAvatar({ name: this.getUserName() })
  }
}

export default UserModel;
