/**
 * Provide meaningful defaults for MenuItems
 * Used in SideBar and Profile Menu
 */
class ProgressStepModel {
  constructor({ status, icon, step, title, to, clickable }) {
    this.status = status || "disabled";
    this.iconName = icon || false;
    this.step = step || 1;
    this.title = title || "";
    this.to = to || { name: "not-found" };
    this.clickable = clickable || false;
  }
}

export default ProgressStepModel;
