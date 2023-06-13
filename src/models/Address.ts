/**
 * The address model.
 */
class AddressModel {
  id: string;
  buildingNumber: string;
  postalCode: string;
  street: string;
  city: string;

  // TODO Null checking
  /**
   * Create new instance.
   */
  constructor(id: string,
    buildingNumber: string,
    postalCode: string,
    street: string,
    city: string) {
    this.id = id;
    this.buildingNumber = buildingNumber;
    this.postalCode = postalCode;
    this.street = street;
    this.city = city;
  }

  format(): string {
    let buildingNumberCleaned = `${this.street} ${this.buildingNumberCleaned()}, `
    if (this.postalCode) {
      buildingNumberCleaned += `${this.postalCode} `
    }
    buildingNumberCleaned += `${this.city}`
    return buildingNumberCleaned
  }

  buildingNumberCleaned(): string {
    return this.buildingNumber.trim();
  }
}

export default AddressModel;
