<script setup lang="ts">
import { ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'

import api from '@/services/fundermaps'
import type { IPDOKSuggestion } from '@/services/fundermaps/interfaces/IPDOKSuggestion'
import type { IAddress } from '@/services/fundermaps/interfaces/IAddress'
import { describeFailure } from '@/services/fundermaps/errors'

/**
 * Find a pand by address.
 *
 * Two hops, because PDOK and our geocoder speak different dialects: PDOK's
 * suggest endpoint returns its own internal ids, which have to be resolved to a
 * BAG NUMMERAANDUIDING before the geocoder will recognise them. Both hops
 * happen on pick, so typing stays cheap.
 */
const emit = defineEmits<{ pick: [address: IAddress] }>()

const query = ref('')
const suggestions = ref<IPDOKSuggestion[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const resolving = ref(false)
const cursor = ref(0)

const search = useDebounceFn(async (q: string) => {
  if (q.trim().length < 3) {
    suggestions.value = []
    return
  }
  try {
    loading.value = true
    error.value = null
    suggestions.value = await api.pdok.suggest(q)
    cursor.value = 0
  } catch (e) {
    error.value = describeFailure(e, 'Adressen zoeken is niet gelukt.')
  } finally {
    loading.value = false
  }
}, 250)

watch(query, (q) => search(q))

async function pick(suggestion: IPDOKSuggestion | undefined) {
  if (!suggestion || resolving.value) return
  try {
    resolving.value = true
    error.value = null
    const bagId = await api.pdok.lookupNummeraanduidingId(suggestion.id)
    if (!bagId) {
      error.value = 'Geen BAG-id gevonden voor dit adres.'
      return
    }
    emit('pick', await api.geocoder.getAddress(bagId))
    query.value = ''
    suggestions.value = []
  } catch (e) {
    error.value = describeFailure(e, 'Dit adres kon niet worden opgezocht.')
  } finally {
    resolving.value = false
  }
}

function move(delta: number) {
  if (!suggestions.value.length) return
  cursor.value = Math.max(0, Math.min(suggestions.value.length - 1, cursor.value + delta))
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center gap-2 rounded-lg border border-line bg-sunken px-2.5 py-1.5">
      <span aria-hidden="true" class="text-base text-faint">⌕</span>
      <input
        v-model="query"
        type="text"
        class="studio-control"
        placeholder="Straat huisnummer, plaats"
        autocomplete="off"
        aria-label="Adres zoeken"
        @keydown.down.prevent="move(1)"
        @keydown.up.prevent="move(-1)"
        @keydown.enter.prevent="pick(suggestions[cursor])"
      />
    </div>

    <p v-if="resolving" class="text-sm text-muted">Adres opzoeken…</p>
    <p v-else-if="loading" class="text-sm text-muted">Zoeken…</p>
    <p v-if="error" class="text-sm text-red">{{ error }}</p>

    <ul v-if="suggestions.length" class="overflow-hidden rounded-lg border border-line">
      <li
        v-for="(suggestion, i) in suggestions"
        :key="suggestion.id"
        class="text-md cursor-pointer border-b border-divider px-2.5 py-1.5 text-body last:border-b-0"
        :class="i === cursor ? 'bg-blue-wash' : 'hover:bg-raised'"
        @click="pick(suggestion)"
        @mousemove="cursor = i"
      >
        {{ suggestion.weergavenaam }}
      </li>
    </ul>

    <p v-else-if="query.trim().length >= 3 && !loading" class="text-sm text-muted">
      Geen suggesties.
    </p>
  </div>
</template>
