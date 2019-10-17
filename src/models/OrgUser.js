
import { generateAvatar } from 'utils/namedavatar'

/**
 * Just a pretty wrapper for now
 */
let OrgUserModel = function (user) {
  Object.assign(this, user.user, { role: user.role })
}

// ****************************************************************************
//  User Name
// ****************************************************************************

/**
 * Aim to get the most natural name by which to identify the user
 */
OrgUserModel.prototype.getUserName = function() {

  // First try given and/or last name
  let name = '';
  if (this.given_name) {
    name += this.given_name;
  }
  if (this.last_name) {
    name += ' ' + this.last_name
  }
  if (name) {
    return name.trim();
  }
  // Check for a specific user_name as alternative
  if (this.user_name) {
    return this.user_name
  }
  // Resort to email
  return this.email;
}

// ****************************************************************************
//  Role
// ****************************************************************************

OrgUserModel.prototype.getRoleSlug = function() {
  switch(this.role) {
    case 0:
      return 'Superuser';
    case 1:
      return 'Verifier'
    case 2:
      return 'Writer'
    case 3:
      return 'Reader'
  }
  return 'Unknown'
}

/**
 * The translated role name
 */
OrgUserModel.prototype.getRoleName = function() {
  switch(this.getRoleSlug()) {
    case 'Admin':
      return 'Admin';
    case 'Superuser':
      return 'Beheerder';
    case 'Verifier':
      return 'Reviewer'
    case 'Writer':
      return 'Verwerker'
    case 'Reader':
      return 'Alleen lezen'
  }
  return 'Unknown'
}

/**
 * Whether or not the user is able to approve / disapprove reports
 */
OrgUserModel.prototype.canReview = function() {
  return ['Admin', 'Superuser', 'Reviewer'].includes(this.getRoleSlug());
}

/**
 * Whether or not the user is able to create and edit reports
 */
OrgUserModel.prototype.canCreate = function() {
  return ['Admin', 'Superuser', 'Creator'].includes(this.getRoleSlug());
}

// ****************************************************************************
//  Avatar
// ****************************************************************************

/**
 * Get the avatar image
 */
OrgUserModel.prototype.getAvatar = function() {
  if (this.hasAvatar()) {
    return this.avatar
  }
  return this.generateAvatar();
}

/**
 * Whether the user has uploaded an Avatar
 */
OrgUserModel.prototype.hasAvatar = function() {
  return this.avatar !== '' && this.avatar !== null
}

/**
 * Generate a default avatar
 */
OrgUserModel.prototype.generateAvatar = function() {
  return generateAvatar({ name: this.getUserName() })
}

export default OrgUserModel;