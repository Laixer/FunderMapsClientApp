
/**
 * Provide meaningful defaults for MenuItems
 * Used in SideBar and Profile Menu
 */
class ProgressStepModel {
  constructor({ status, icon, step, to, clickable }) {
    this.status = status || 'disabled';
    this.iconName = icon || false;
    this.step = step || 1;
    this.to = to || { name: 'not-found' };
    this.clickable = clickable || false;
  }
}

export default ProgressStepModel;