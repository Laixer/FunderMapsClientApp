import axios from '../utils/axios'

export default {
    /**
     * Lists all address suggestions for a given query.
     * @param query The query string.
     */
    getAddressSuggestions(query: string) {
        return axios.get(`https://api.pdok.nl/bzk/locatieserver/search/v3_1/suggest?fq=type:adres&q=${query}&rows=10`);
    },

    /**
     * Gets a single address from our geocoder.
     * @param id Internal address id.
     */
    getAddressById(id: string) {
        return axios.get(`/api/geocoder/address/${id}`);
    }
}
