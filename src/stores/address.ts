import { ref } from 'vue'
import { defineStore } from 'pinia'

import api from '@/services/fundermaps'
import type { IAddress } from '@/services/fundermaps/interfaces/IAddress'

/**
 * Address cache. Sample rows ship a `gfm-` id; the human-readable address
 * comes from /api/geocoder/address/{id}. Multiple views (InquiryView,
 * Step2, Step3) all need this for the same ids during one session — cache
 * once.
 */
export const useAddressStore = defineStore('address', () => {
  const cache = ref<Record<string, IAddress>>({})

  async function getById(id: string): Promise<IAddress | null> {
    if (cache.value[id]) return cache.value[id]
    try {
      const a = await api.geocoder.getAddress(id)
      cache.value[id] = a
      return a
    } catch {
      return null
    }
  }

  /**
   * Fetch all missing ids; returns a map covering whatever was found. Resolves
   * in bounded batches — an inquiry can carry thousands of addresses, and one
   * geocoder request per address fired all at once would swamp the API.
   */
  async function ensureMany(ids: string[], batchSize = 25): Promise<Record<string, IAddress>> {
    const missing = [...new Set(ids)].filter((id) => !cache.value[id])
    for (let i = 0; i < missing.length; i += batchSize) {
      await Promise.all(missing.slice(i, i + batchSize).map(getById))
    }
    const out: Record<string, IAddress> = {}
    for (const id of ids) {
      const hit = cache.value[id]
      if (hit) out[id] = hit
    }
    return out
  }

  return { cache, getById, ensureMany }
})
