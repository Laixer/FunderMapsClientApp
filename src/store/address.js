/**
 * Import model.
 */
import AddressModel from 'model/Address.ts'

/**
 * Import API.
 */
import addressAPI from 'api/address';

/**
 * Declare store variables.
 * TODO Store everything here.
 */
const state = {
  // TODO Not used.
  addressCollection: []
}

/**
 * Declare getters.
 */
const getters = {
  getAddressCollection: state => { 
    return state.addressCollection;
  },
  getAddressByIdFromCollection: state => ({ id }) => {
    return state.addressCollection.find(x => { return x.id === id; })
  }
}

/**
 * Declare actions.
 */
const actions = {
  /**
   * Checks if an address exists in our collection. If
   * not this will fetch from the API and add.
   */
  async getAddressById({ commit, getters }, { id }) {
    if (!id) {
      throw new Error('Address id cannot be null');
    }

    // Only fetch the address if our collection doesn't contain it.
    if (!getters.getAddressByIdFromCollection({ id })) {
      let response = await addressAPI.getAddressById(id);
      if (response.status === 200) {
        commit('add_address_to_collection', {
          address: response.data
        });
      } else {
        throw new Error($`Could not find address with id ${id}`);
      }
    }

    return getters.getAddressByIdFromCollection({ id });
  },
  /**
   * Get address suggestions based on a query
   */
  async getAddressSuggestions({ commit }, { query }) {
    if (!query) {
      throw new Error('Query cannot be null');
    }

    let response = await addressAPI.getAddressSuggestions(query);
    if (response.status === 200) {
      return response.data.map(address => new AddressModel(
        address.id, 
        address.buildingNumber, 
        address.postalCode, 
        address.street, 
        address.city));
    }
  }
}
const mutations = {
  /**
   * Adds an address to the state address collection.
   * TODO Duplicate check.
   */
  add_address_to_collection(state, { address }) {
    state.addressCollection.push(new AddressModel(
      address.id, 
      address.buildingNumber, 
      address.postalCode, 
      address.street, 
      address.city));
  },
}

/**
 * Export
 */
export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
