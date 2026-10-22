<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDebounceFn } from '@vueuse/core'

import api from '@/services/fundermaps'
import type { IPDOKSuggestion } from '@/services/fundermaps/interfaces/IPDOKSuggestion'
import { describeFailure } from '@/services/fundermaps/errors'
import { pandItem } from '@/services/palette'

/**
 * Find a pand (2026-10-22, the Panden finder): an address, a postcode, or a
 * BAG number, in one box. An address goes through PDOK (suggest, then the BAG
 * id), a BAG number straight to its page; Enter takes the highlighted one.
 * Large: on the finder it is the page's first job.
 */
withDefaults(defineProps<{ autofocus?: boolean }>(), { autofocus: false })

const router = useRouter()
const query = ref('')
const suggestions = ref<IPDOKSuggestion[]>([])
const loading = ref(false)
const resolving = ref(false)
const error = ref<string | null>(null)
const cursor = ref(0)

/** A pasted BAG number needs no search: it is the pand (or one of its addresses). */
const direct = computed(() => pandItem(query.value))
const options = computed(() => [
  ...(direct.value ? [{ key: 'bag', label: direct.value.label, hint: 'BAG-nummer' }] : []),
  ...suggestions.value.map((s) => ({ key: s.id, label: s.weergavenaam, hint: 'adres' })),
])

const search = useDebounceFn(async (q: string) => {
  if (q.trim().length < 3 || pandItem(q)) {
    suggestions.value = []
    return
  }
  try {
    loading.value = true
    error.value = null
    suggestions.value = await api.pdok.suggest(q, 8)
    cursor.value = 0
  } catch (e) {
    error.value = describeFailure(e, 'Adressen zoeken is niet gelukt.')
  } finally {
    loading.value = false
  }
}, 220)
watch(query, (q) => {
  cursor.value = 0
  void search(q)
})

async function pick(i: number) {
  const option = options.value[i]
  if (!option) return
  if (option.key === 'bag' && direct.value?.to) {
    await router.push(direct.value.to)
    return
  }
  try {
    resolving.value = true
    const id = await api.pdok.lookupNummeraanduidingId(option.key)
    if (!id) throw new Error('PDOK gaf geen BAG-adres terug')
    // The Pand page takes an address id and moves on to its pand.
    await router.push({ name: 'building', params: { id } })
  } catch (e) {
    error.value = describeFailure(e, 'Dit adres kon niet worden opgezocht.')
  } finally {
    resolving.value = false
  }
}

const move = (step: number) => {
  if (!options.value.length) return
  cursor.value = (cursor.value + step + options.value.length) % options.value.length
}
</script>

<template>
  <div class="relative flex flex-col gap-2">
    <!-- The Studio's search field (sunken, a hairline, green when typing), one size up: here it is the page's job. -->
    <div
      class="flex items-center gap-2.5 rounded-lg border border-line bg-sunken px-3 py-2 focus-within:border-green focus-within:ring-2 focus-within:ring-green/30"
    >
      <span aria-hidden="true" class="text-lg text-faint">⌕</span>
      <input
        v-model="query"
        type="text"
        class="studio-control !text-lg"
        placeholder="Adres, postcode of BAG-nummer — bijvoorbeeld Voorbeeldstraat 12 Amsterdam"
        autocomplete="off"
        aria-label="Pand zoeken"
        role="combobox"
        :aria-expanded="options.length > 0"
        aria-controls="pand-search-options"
        :autofocus="autofocus"
        @keydown.down.prevent="move(1)"
        @keydown.up.prevent="move(-1)"
        @keydown.enter.prevent="pick(cursor)"
      />
      <span v-if="loading || resolving" class="text-sm shrink-0 text-faint">{{ resolving ? 'openen…' : 'zoeken…' }}</span>
    </div>
    <p v-if="error" class="text-sm text-red">{{ error }}</p>
    <ul
      v-if="options.length"
      id="pand-search-options"
      role="listbox"
      aria-label="Gevonden panden"
      class="overflow-hidden rounded-lg border border-line bg-surface"
    >
      <li
        v-for="(o, i) in options"
        :key="o.key"
        role="option"
        :aria-selected="i === cursor"
        class="text-md flex cursor-pointer items-center gap-3 border-b border-divider px-3 py-1.5 last:border-b-0"
        :class="i === cursor ? 'bg-blue-wash' : 'hover:bg-raised'"
        @click="pick(i)"
        @mousemove="cursor = i"
      >
        <span class="min-w-0 flex-1 truncate text-body">{{ o.label }}</span>
        <span class="text-xs shrink-0 font-mono text-faint">{{ o.hint }}</span>
      </li>
    </ul>
    <p v-else-if="query.trim().length >= 3 && !loading && !error" class="text-sm text-muted">Geen adres gevonden.</p>
  </div>
</template>
