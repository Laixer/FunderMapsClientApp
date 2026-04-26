<script setup lang="ts">
import { ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'

import api from '@/services/fundermaps'
import type { IPDOKSuggestion } from '@/services/fundermaps/interfaces/IPDOKSuggestion'
import type { IAddress } from '@/services/fundermaps/interfaces/IAddress'
import { getErrorMessage } from '@/services/fundermaps/errors'

const emit = defineEmits<{
  pick: [address: IAddress]
}>()

const query = ref('')
const suggestions = ref<IPDOKSuggestion[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const resolving = ref(false)

const search = useDebounceFn(async (q: string) => {
  if (!q.trim() || q.trim().length < 3) {
    suggestions.value = []
    return
  }
  try {
    loading.value = true
    error.value = null
    suggestions.value = await api.pdok.suggest(q)
  } catch (e) {
    error.value = getErrorMessage(e) ?? 'Adres ophalen mislukt.'
  } finally {
    loading.value = false
  }
}, 250)

watch(query, (q) => search(q))

async function pick(s: IPDOKSuggestion) {
  if (resolving.value) return
  try {
    resolving.value = true
    error.value = null
    // PDOK suggest returns its own internal id (e.g. `adr-...`); our geocoder
    // only understands BAG NUMMERAANDUIDING/PAND ids. Look up the BAG id first.
    const bagId = await api.pdok.lookupNummeraanduidingId(s.id)
    if (!bagId) {
      error.value = 'Geen BAG-id gevonden voor dit adres.'
      return
    }
    const resolved = await api.geocoder.getAddress(bagId)
    emit('pick', resolved)
    query.value = ''
    suggestions.value = []
  } catch (e) {
    error.value = getErrorMessage(e) ?? 'Adres niet gevonden.'
  } finally {
    resolving.value = false
  }
}
</script>

<template>
  <div class="space-y-2">
    <input
      v-model="query"
      type="text"
      placeholder="Zoek adres (straat huisnummer, plaats)…"
      class="w-full rounded border border-grey-400 p-2"
      autocomplete="off"
    />
    <p v-if="loading" class="text-sm text-grey-700">Zoeken…</p>
    <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

    <ul v-if="suggestions.length" class="divide-y divide-grey-200 rounded border border-grey-200">
      <li
        v-for="s in suggestions"
        :key="s.id"
        class="cursor-pointer px-3 py-2 text-sm hover:bg-grey-100"
        @click="pick(s)"
      >
        {{ s.weergavenaam }}
      </li>
    </ul>
    <p v-else-if="query.length >= 3 && !loading" class="text-sm text-grey-700">
      Geen suggesties.
    </p>
  </div>
</template>
