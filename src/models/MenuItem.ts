
/**
 * The menu item model
 */

import { icon } from '../helpers/assets';

/**
 * Provide meaningful defaults for MenuItems
 * Used in SideBar and Profile Menu
 */
class MenuItemModel {
  readonly label: string;
  readonly iconName: string | undefined;
  readonly iconActive: string | undefined;
  readonly to: object;
  active: boolean = false;

  /**
   * Create a new instance.
   */
  constructor(label: string, to: object = { name: 'not-found' }, icon?: string, iconActive?: string) {
    this.label = label;
    this.iconName = icon;
    this.iconActive = iconActive;
    this.to = to;
  }
  hasIcon() {
    return !!this.iconName;
  }
  isActive() {
    return !!this.active;
  }
  setActive(active: boolean) {
    this.active = active;
  }
  getIcon() {
    let iconImage = this.iconActive && this.active ? this.iconActive : this.iconName;
    if (!iconImage) {
      throw new Error('icon is not available');
    }
    return icon(iconImage);
  }
}

export default MenuItemModel;