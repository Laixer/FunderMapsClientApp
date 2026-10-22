<script setup lang="ts">
import { computed, ref } from 'vue'

import Panel from '@/components/Common/Panel.vue'
import type { IReaderQuality, IReaderTally } from '@/services/fundermaps/interfaces/IDataops'
import { MIN_JUDGED, WATCH_RATE, missRate } from '@/services/readerTrack'
import { fieldLabel } from '@/services/reviewLabels'

/**
 * How well the document reader reads, per field (2026-10-22): of every value
 * it proposed and a reviewer judged, how much was left standing, corrected or
 * rejected. Worst first, so the fields to watch are on top; the reader's
 * versions side by side, so an improvement shows. The same numbers stand as a
 * hint beside every proposed value on the dossier page.
 */
const props = defineProps<{ quality: IReaderQuality }>()

const nl = (n: number) => n.toLocaleString('nl-NL')
const pct = (n: number, digits = 0) =>
  `${(n * 100).toLocaleString('nl-NL', { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`
const share = (t: IReaderTally, k: 'confirmed' | 'corrected' | 'rejected') => (t.judged ? t[k] / t.judged : 0)

/** On a card "Soort" sits under the rapportage it belongs to; in a list of fields it needs its noun. */
const LIST_LABEL: Record<string, string> = { inquiry_type: 'Soort onderzoek' }
const label = (field: string) => LIST_LABEL[field] ?? fieldLabel(field)

const rows = computed(() =>
  props.quality.fields
    .filter((f) => f.judged >= MIN_JUDGED)
    .map((f) => ({ ...f, label: label(f.field), miss: missRate(f) }))
    .sort((a, b) => b.miss - a.miss || b.judged - a.judged),
)
const few = computed(() => props.quality.fields.filter((f) => f.judged < MIN_JUDGED))

/** The ten weakest first; the rest on request (2026-10-22: the whole list made the page "way too big"). */
const SHOWN = 10
const showAll = ref(false)
const shown = computed(() => (showAll.value ? rows.value : rows.value.slice(0, SHOWN)))

/** "dataops-2026.2" says the version; the model is the same for all of them so far. */
const versions = computed(() =>
  props.quality.versions.map((v) => ({ ...v, name: v.promptVersion.replace(/^dataops-/, ''), miss: missRate(v) })),
)
</script>

<template>
  <Panel title="Hoe goed leest de documentlezer?" :meta="`${nl(quality.total.judged)} waarden beoordeeld`">
    <template #actions>
      <!-- The legend: three outcomes, each a swatch beside its word. -->
      <span class="text-sm flex items-center gap-3 text-muted">
        <span class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-xs bg-green-ink" />overgenomen</span>
        <span class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-xs bg-[#e8857c]" />verbeterd</span>
        <span class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-xs bg-red-ink" />afgewezen</span>
      </span>
    </template>

    <div class="flex flex-col gap-3">
      <p class="text-md text-body">
        Van {{ nl(quality.total.judged) }} waarden die de lezer voorstelde en een beoordelaar beoordeelde, bleef
        <strong>{{ pct(share(quality.total, 'confirmed'), 1) }}</strong> staan;
        {{ pct(share(quality.total, 'corrected'), 1) }} werd verbeterd en {{ pct(share(quality.total, 'rejected'), 1) }} afgewezen.
        <span class="text-muted">Overgenomen telt ook reeksen die in één klik werden overgenomen.</span>
      </p>

      <!-- The versions side by side: the share not taken over, per version. -->
      <div v-if="versions.length > 1" class="flex flex-wrap gap-2">
        <span
          v-for="v in versions"
          :key="v.promptVersion"
          class="text-sm rounded-lg border border-line bg-raised px-3 py-1.5"
          :title="`${v.model}, ${v.promptVersion}: ${nl(v.confirmed)} overgenomen, ${nl(v.corrected)} verbeterd, ${nl(v.rejected)} afgewezen`"
        >
          <span class="font-semibold text-strong">Lezer {{ v.name }}</span>
          <span class="ml-2 font-mono tabular-nums" :class="v.miss >= WATCH_RATE ? 'text-amber-ink' : 'text-muted'">
            {{ pct(v.miss, 1) }} niet overgenomen
          </span>
          <span class="ml-2 font-mono text-faint">n={{ nl(v.judged) }}</span>
        </span>
      </div>

      <!-- One bar per field, worst first. -->
      <div role="table" aria-label="Per veld" class="flex flex-col">
        <div
          role="row"
          class="grid grid-cols-[minmax(0,170px)_minmax(0,1fr)_84px_64px] items-center gap-4 border-b border-divider pb-1.5 text-xs font-bold tracking-[0.06em] text-label uppercase"
        >
          <span role="columnheader">Veld</span>
          <span role="columnheader">Wat ermee gebeurde</span>
          <span role="columnheader" class="text-right" title="Niet overgenomen: verbeterd of afgewezen">Niet overg.</span>
          <span role="columnheader" class="text-right">Beoordeeld</span>
        </div>
        <div
          v-for="r in shown"
          :key="r.field"
          role="row"
          class="grid grid-cols-[minmax(0,170px)_minmax(0,1fr)_84px_64px] items-center gap-4 border-b border-divider py-1 last:border-b-0"
          :title="`${r.label}: ${nl(r.confirmed)} overgenomen, ${nl(r.corrected)} verbeterd, ${nl(r.rejected)} afgewezen`"
        >
          <span role="cell" class="text-md truncate text-body">{{ r.label }}</span>
          <span role="cell" class="flex h-2.5 gap-[2px] overflow-hidden rounded-full">
            <span class="bg-green-ink" :style="{ flexGrow: r.confirmed, flexBasis: 0 }" />
            <span v-if="r.corrected" class="bg-[#e8857c]" :style="{ flexGrow: r.corrected, flexBasis: 0, minWidth: '3px' }" />
            <span v-if="r.rejected" class="bg-red-ink" :style="{ flexGrow: r.rejected, flexBasis: 0, minWidth: '3px' }" />
          </span>
          <span
            role="cell"
            class="text-right font-mono tabular-nums"
            :class="r.miss >= WATCH_RATE ? 'font-semibold text-amber-ink' : 'text-muted'"
          >
            {{ pct(r.miss, 1) }}
          </span>
          <span role="cell" class="text-right font-mono tabular-nums text-faint">{{ nl(r.judged) }}</span>
        </div>
      </div>

      <button
        v-if="rows.length > SHOWN"
        type="button"
        class="text-md self-start font-semibold text-blue hover:underline"
        :aria-expanded="showAll"
        @click="showAll = !showAll"
      >
        {{ showAll ? `Alleen de ${SHOWN} zwakste` : `Toon alle ${rows.length} velden` }}
      </button>

      <p v-if="few.length && showAll" class="text-sm text-faint">
        {{ few.length }} {{ few.length === 1 ? 'veld heeft' : 'velden hebben' }} nog minder dan {{ MIN_JUDGED }} oordelen en
        {{ few.length === 1 ? 'staat' : 'staan' }} hier niet:
        {{ few.map((f) => label(f.field)).join(', ') }}.
      </p>
    </div>
  </Panel>
</template>
