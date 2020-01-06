
import { generateAvatar } from 'utils/namedavatar';

/**
 * Just a pretty wrapper for now
 */
let AttributedUser = function ({user, role}) {
  Object.assign(this, user);
  this.role = role;
}

AttributedUser.prototype.getName = function() {
  return this.firstName + ' ' + this.lastName;
}
// ****************************************************************************
//  User Name
// ****************************************************************************

/**
 * Aim to get the most natural name by which to identify the user
 */
AttributedUser.prototype.getUserName = function() {

  // First try given and/or last name
  let name = '';
  if (this.firstName) {
    name += this.firstName;
  }
  if (this.middleName) {
    name += ' ' + this.middleName
  }  
  if (this.lastName) {
    name += ' ' + this.lastName
  }
  if (name) {
    return name.trim();
  }
  // Check for a specific user_name as alternative
  if (this.nickName) {
    return this.nickName
  }

  if (this.name) {
    return this.name
  }
  
  // Resort to email
  return this.email;
}

AttributedUser.prototype.getRole = function() {
  return this.role;
}

// ****************************************************************************
//  Avatar
// ****************************************************************************

/**
 * Attributed users don't have an avatar prop, so straight to generated avatar
 */
AttributedUser.prototype.getAvatar = function() {
  return generateAvatar({ name: this.getUserName() })
}


export default AttributedUser;