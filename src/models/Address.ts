/**
 * Address model — wraps the /api/geocoder/address/{id} payload from
 * FunderMapsApi. Field names mirror the canonical TS API (snake_case).
 */
class AddressModel {
  id!: string;
  external_id?: string;
  building_number!: string;
  postal_code?: string;
  street!: string;
  city!: string;
  building_id!: string;

  constructor(payload: Partial<AddressModel>) {
    Object.assign(this, payload);
  }

  format(): string {
    let out = `${this.street} ${this.cleanedBuildingNumber()}, `;
    if (this.postal_code) {
      out += `${this.postal_code} `;
    }
    out += `${this.city}`;
    return out;
  }

  cleanedBuildingNumber(): string {
    return (this.building_number || '').trim();
  }
}

export default AddressModel;
