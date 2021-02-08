/**
 * Import model.
 */
import AddressModel from 'model/Address.ts'
import PDOKAddressSuggestion from 'model/PDOKAddressSuggestion'

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
    let _id = null;
    // Only fetch the address if our collection doesn't contain it.
    if (!getters.getAddressByIdFromCollection({ id })) {
      let response = await addressAPI.getAddressById(id);
      if (response.status === 200) {
        _id = response.data.addressId
        commit('add_address_to_collection', {
          address: response.data
        });
      } else {
        throw new Error($`Could not find address with id ${id}`);
      }
    }

    return getters.getAddressByIdFromCollection({ id: _id });
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
      return response.data.response.docs.map(suggestion =>
        new PDOKAddressSuggestion(
          suggestion.id,
          suggestion.type,
          suggestion.weergavenaam,
          suggestion.score,
          response.data.highlighting[suggestion.id].suggest[0]
        )
      )
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
      // TODO: There is more that is returned
      address.addressId,
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
