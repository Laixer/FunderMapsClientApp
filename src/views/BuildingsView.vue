<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'

import AppShell from '@/components/Layout/AppShell.vue'
import PageHeader from '@/components/Common/PageHeader.vue'
import Panel from '@/components/Common/Panel.vue'
import PandSearch from '@/components/Building/PandSearch.vue'
import api from '@/services/fundermaps'
import type { IPandenOpen } from '@/services/fundermaps/interfaces/IDataops'
import { describeFailure } from '@/services/fundermaps/errors'
import { recentPanden, type RecentPand } from '@/services/recentPanden'
import { formatDate } from '@/utils/date'

/**
 * Panden (2026-10-22: "The pand page is really important … both how it looks
 * and how easy it is to navigate to"): the way in to every pand's page. Search
 * first — an address, a postcode, a BAG number — then the panden with work
 * on the desk, and the ones you looked at last.
 */
const open = ref<IPandenOpen | null>(null)
const error = ref<string | null>(null)
const recent = ref<RecentPand[]>(recentPanden())

onBeforeMount(async () => {
  try {
    open.value = await api.dataops.pandenOpen()
  } catch (e) {
    error.value = describeFailure(e, 'De panden met open werk konden niet worden opgehaald.')
  }
})

const nl = (n: number) => n.toLocaleString('nl-NL')
const addressOf = (r: IPandenOpen['open'][number]) => (r.street ? `${r.street} ${r.number ?? ''}`.trim() : r.id.replace(/^NL\.IMBAG\.PAND\./, 'Pand '))
</script>

<template>
  <AppShell crumb="Panden">
    <div class="flex flex-col gap-4 px-6 py-4">
      <PageHeader
        kicker="Gegevens"
        title="Panden"
        purpose="Elk pand met zijn hele verhaal: onderzoek, herstel, meldingen en wat het model erover zegt."
      />

      <div class="max-w-[880px]">
        <PandSearch autofocus />
      </div>

      <div class="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-start gap-3">
        <Panel title="Panden met open werk" :meta="open ? `${nl(open.total)} panden` : undefined" flush>
          <p v-if="error" class="text-md px-4 py-3 text-red">{{ error }}</p>
          <div v-else-if="open" role="table" aria-label="Panden met open werk">
            <div
              role="row"
              class="text-xs grid grid-cols-[minmax(0,1fr)_160px_70px_80px_110px] gap-3 border-b border-divider bg-raised px-4 py-2 font-bold tracking-[0.06em] text-label uppercase"
            >
              <span role="columnheader">Adres</span>
              <span role="columnheader">Gemeente</span>
              <span role="columnheader" class="text-right">Open</span>
              <span role="columnheader" class="text-right">Dossiers</span>
              <span role="columnheader">Laatst binnen</span>
            </div>
            <RouterLink
              v-for="r in open.open"
              :key="r.id"
              :to="{ name: 'building', params: { id: r.id } }"
              role="row"
              class="text-md grid grid-cols-[minmax(0,1fr)_160px_70px_80px_110px] items-center gap-3 border-b border-divider px-4 py-2 last:border-b-0 hover:bg-raised"
            >
              <span role="cell" class="truncate font-semibold text-ink">{{ addressOf(r) }}<span v-if="r.city" class="font-normal text-muted">, {{ r.city }}</span></span>
              <span role="cell" class="truncate text-muted">{{ r.municipality ?? '—' }}</span>
              <span role="cell" class="text-right font-mono tabular-nums text-amber-ink">{{ nl(r.open) }}</span>
              <span role="cell" class="text-right font-mono tabular-nums text-muted">{{ nl(r.dossiers) }}</span>
              <span role="cell" class="text-sm font-mono text-faint">{{ formatDate(r.lastReceived) }}</span>
            </RouterLink>
            <p v-if="open.total > open.open.length" class="text-sm px-4 py-2 text-faint">
              De nieuwste {{ nl(open.open.length) }} van {{ nl(open.total) }}. Zoek hierboven voor een ander pand.
            </p>
          </div>
          <p v-else class="text-md px-4 py-3 text-muted">Ophalen…</p>
        </Panel>

        <Panel title="Laatst bekeken" :meta="recent.length ? `in deze browser` : undefined">
          <ul v-if="recent.length" class="flex flex-col">
            <li v-for="r in recent" :key="r.id" class="border-b border-divider last:border-b-0">
              <RouterLink :to="{ name: 'building', params: { id: r.id } }" class="flex flex-col py-2 hover:bg-raised">
                <span class="text-md truncate font-semibold text-ink">{{ r.title }}</span>
                <span class="text-sm truncate text-muted">{{ r.place }} · {{ formatDate(r.at) }}</span>
              </RouterLink>
            </li>
          </ul>
          <p v-else class="text-md text-muted">Nog geen pand bekeken. Een pand dat je opent, staat hier daarna.</p>
        </Panel>
      </div>
    </div>
  </AppShell>
</template>
