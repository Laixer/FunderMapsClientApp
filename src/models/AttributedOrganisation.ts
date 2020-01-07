
import { generateAvatar } from '../utils/namedavatar';

/**
 * Mostly just a pretty wrapper for now
 */
// TODO: Can we remove 'role'?
export default class AttributedOrganisation {
  readonly id: string;
  readonly name: string | null;
  readonly role: string;

  /**
   * Create a new instance.
   */
  constructor(id: string, role: string, name?: string) {
    this.id = id;
    this.name = name || null;
    this.role = role;
  }

  // ****************************************************************************
  //  Avatar
  // ****************************************************************************
  /**
   * Attributed users don't have an avatar prop, so straight to generated avatar
   */
  getAvatar() {
    return generateAvatar({ name: this.name });
  }
}
