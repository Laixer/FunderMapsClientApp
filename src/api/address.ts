import axios from '../utils/axios'

export default {
    /**
     * Lists all address suggestions for a given query.
     * @param query The query string.
     */
    async getAddressSuggestions(query: string) {
        return await fetch(
            `https://api.pdok.nl/bzk/locatieserver/search/v3_1/suggest?fq=type:adres&q=${query}&rows=10`
        )
    },

    /**
     * Gets a single address from our geocoder by id.
     * Canonical FunderMapsApi path: /api/geocoder/:id/address
     * @param id Internal geocoder id.
     */
    getAddressById(id: string) {
        return axios.get(`/api/geocoder/${id}/address`);
    }
}
