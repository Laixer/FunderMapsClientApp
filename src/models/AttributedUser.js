import { generateAvatar } from 'utils/namedavatar';

/**
 * Wraps a user payload (from /api/reviewer or any other user-shape endpoint)
 * with an attribution role (e.g. "Reviewer", "Creator"). Reads the canonical
 * snake_case wire shape.
 */
const AttributedUser = function ({ user, role }) {
  Object.assign(this, user);
  this.role = role;
}

AttributedUser.prototype.getName = function () {
  return [this.given_name, this.family_name].filter(Boolean).join(' ');
}

AttributedUser.prototype.getUserName = function () {
  const name = [this.given_name, this.family_name].filter(Boolean).join(' ').trim();
  return name || this.email || '';
}

AttributedUser.prototype.getRole = function () {
  return this.role;
}

// Attributed users don't have an avatar prop, so straight to generated avatar
AttributedUser.prototype.getAvatar = function () {
  return generateAvatar({ name: this.getUserName() })
}

export default AttributedUser;
