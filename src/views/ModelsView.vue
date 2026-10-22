<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue'

import AppShell from '@/components/Layout/AppShell.vue'
import Button from '@/components/Common/Buttons/Button.vue'
import PageHeader from '@/components/Common/PageHeader.vue'
import Panel from '@/components/Common/Panel.vue'

import api from '@/services/fundermaps'
import type { IModels, IRiskClasses, RunState } from '@/services/fundermaps/interfaces/IDataops'
import { describeFailure } from '@/services/fundermaps/errors'
import { FOUNDATION_TYPE_CODE_LABELS } from '@/services/reviewLabels'

/**
 * Modellen (2026-10-22): how the model runs and what it says now — the start
 * of the Studio's models section from the 5.0 plan.
 *
 * Runs: the last 14 days, two refreshes a day, each a dot. What it says: the
 * served (default) model's foundation types, and the four risks in the map's
 * own colours A–E. Counted by the API after each refresh (GET /dataops/models).
 * Comparing model versions needs read access the API does not have yet.
 */
const data = ref<IModels | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    data.value = await api.dataops.models()
  } catch (e) {
    error.value = describeFailure(e, 'De modelgegevens konden niet worden opgehaald.')
  } finally {
    loading.value = false
  }
}
onBeforeMount(load)

const nl = (n: number) => n.toLocaleString('nl-NL')
const pct = (part: number, whole: number, digits = 0) =>
  whole > 0
    ? `${((part / whole) * 100).toLocaleString('nl-NL', { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`
    : '—'
const time = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }) : ''
const dayShort = (day: string) => new Date(`${day}T12:00:00`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
const weekday = (day: string) => new Date(`${day}T12:00:00`).toLocaleDateString('nl-NL', { weekday: 'short' })

/* ---------------------------------------------------------------- runs */

/** Oldest left, like a timeline. */
const days = computed(() => [...(data.value?.grid ?? [])].reverse())
const runCount = computed(() => {
  const all = (data.value?.grid ?? []).flatMap((d) => [d.midday, d.evening]).filter((s) => s.status !== 'upcoming')
  return { ok: all.filter((s) => s.status === 'ok').length, all: all.length }
})
const lastRun = computed(() => data.value?.spread.refreshedAt ?? null)

const RUN_DOT: Record<RunState, string> = {
  ok: 'bg-green-ink border-green-ink',
  failed: 'bg-red-ink border-red-ink',
  missing: 'bg-surface border-red-ink',
  upcoming: 'bg-surface border-line-hover border-dashed',
}
const RUN_WORD: Record<RunState, string> = { ok: 'gelukt', failed: 'mislukt', missing: 'niet gedraaid', upcoming: 'nog niet aan de beurt' }

/** Decimal units, as the export is quoted elsewhere ("3,35 GB"). */
const GB = (b: number | string) => `${(Number(b) / 1e9).toLocaleString('nl-NL', { maximumFractionDigits: 2 })} GB`
const MB = (b: number | string) => `${(Number(b) / 1e6).toLocaleString('nl-NL', { maximumFractionDigits: 1 })} MB`
const size = (b: number | string) => (Number(b) >= 1e9 ? GB(b) : MB(b))

/* ------------------------------------------------------- foundation type */

/** The largest types by name; everything under 0.5% folded into one line, so the list stays short. */
const types = computed(() => {
  const s = data.value?.spread
  if (!s) return { shown: [], rest: null as null | { n: number; count: number; names: string } }
  const label = (t: string | null) => (t ? (FOUNDATION_TYPE_CODE_LABELS[t] ?? t) : 'Onbekend')
  const big = s.foundationType.filter((t) => t.n / s.total >= 0.005)
  const small = s.foundationType.filter((t) => t.n / s.total < 0.005)
  return {
    shown: big.map((t) => ({ key: t.type ?? 'none', label: label(t.type), n: t.n })),
    rest: small.length ? { n: small.reduce((a, t) => a + t.n, 0), count: small.length, names: small.map((t) => label(t.type)).join(', ') } : null,
  }
})
const maxType = computed(() => Math.max(1, ...types.value.shown.map((t) => t.n), types.value.rest?.n ?? 0))

/* ---------------------------------------------------------------- risks */

const RISKS = [
  { key: 'drystand', label: 'Droogstand' },
  { key: 'dewatering_depth', label: 'Ontwateringsdiepte' },
  { key: 'bio_infection', label: 'Bacteriële aantasting' },
  // The map and the risk mails call it this (WebFront fieldLabels, API intake-risk-followup).
  { key: 'unclassified', label: 'Vastgesteld risico' },
] as const
const CLASSES = ['a', 'b', 'c', 'd', 'e'] as const
/** The map's own colours, so a class looks here as it does on the map. */
const CLASS_BG: Record<(typeof CLASSES)[number], string> = {
  a: 'bg-risk-10',
  b: 'bg-risk-20',
  c: 'bg-risk-30',
  d: 'bg-risk-40',
  e: 'bg-risk-50',
}
const classified = (r: IRiskClasses) => r.a + r.b + r.c + r.d + r.e
</script>

<template>
  <AppShell crumb="Modellen">
    <div class="flex flex-col gap-3 px-6 py-4">
      <PageHeader
        kicker="Inzicht"
        title="Modellen"
        purpose="Hoe het model draait en wat het nu zegt: het model dat de kaart en de productdienst tonen."
        :meta="lastRun ? `laatste run ${time(lastRun)}` : undefined"
      >
        <template #actions><Button label="Opnieuw ophalen" :disabled="loading" @click="load" /></template>
      </PageHeader>

      <p v-if="error" class="text-md rounded-xl border border-red bg-red-tint px-4 py-3 text-red">{{ error }}</p>

      <Panel title="Runs, laatste 14 dagen" :meta="data ? `${runCount.ok} van ${runCount.all} gelukt` : undefined">
        <template #actions>
          <span class="text-sm flex items-center gap-3 text-muted">
            <span class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full border-2" :class="RUN_DOT.ok" />gelukt</span>
            <span class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full border-2" :class="RUN_DOT.failed" />mislukt</span>
            <span class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full border-2" :class="RUN_DOT.missing" />niet gedraaid</span>
            <span class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full border-2" :class="RUN_DOT.upcoming" />nog niet aan de beurt</span>
          </span>
        </template>
        <div v-if="data" class="flex flex-col gap-3">
          <div role="table" aria-label="Runs per dag" class="grid items-center gap-y-1.5" :style="{ gridTemplateColumns: `56px repeat(${days.length}, minmax(0,1fr))` }">
            <span role="columnheader" />
            <span v-for="d in days" :key="d.day" role="columnheader" class="text-xs text-center text-faint">
              <span class="block">{{ weekday(d.day) }}</span>
              <span class="block font-mono">{{ dayShort(d.day) }}</span>
            </span>
            <template v-for="slot in (['midday', 'evening'] as const)" :key="slot">
              <span role="rowheader" class="text-sm font-mono text-muted">{{ slot === 'midday' ? '12:30' : '21:00' }}</span>
              <span v-for="d in days" :key="`${d.day}-${slot}`" role="cell" class="flex justify-center">
                <span
                  class="h-3 w-3 rounded-full border-2"
                  :class="RUN_DOT[d[slot].status]"
                  :title="`${dayShort(d.day)} ${slot === 'midday' ? '12:30' : '21:00'}: ${RUN_WORD[d[slot].status]}${d[slot].finishedAt ? `, klaar om ${time(d[slot].finishedAt)}` : ''}`"
                >
                  <span class="sr-only">{{ dayShort(d.day) }} {{ slot === 'midday' ? '12:30' : '21:00' }}: {{ RUN_WORD[d[slot].status] }}</span>
                </span>
              </span>
            </template>
          </div>
          <p v-if="data.exports.length" class="text-sm text-muted">
            Laatste kaartexport:
            <template v-for="(e, i) in data.exports" :key="e.tileset">
              <span v-if="i" class="text-faint"> · </span>
              <span class="font-mono text-strong">{{ e.tileset }}</span>
              {{ nl(e.seconds) }} s, {{ size(e.bytes) }}, {{ nl(e.features) }} objecten
            </template>
          </p>
        </div>
        <div v-else-if="loading" class="h-[110px] animate-pulse rounded-xl bg-sunken" aria-label="Laden" />
      </Panel>

      <div class="grid grid-cols-2 gap-3">
        <Panel title="Funderingstype" :meta="data ? `${nl(data.spread.total)} panden` : undefined">
          <div v-if="data" role="table" aria-label="Panden per funderingstype" class="flex flex-col gap-1">
            <div
              v-for="t in types.shown"
              :key="t.key"
              role="row"
              class="grid grid-cols-[minmax(0,190px)_minmax(0,1fr)_120px] items-center gap-3"
            >
              <span role="cell" class="text-md truncate text-body" :title="t.label">{{ t.label }}</span>
              <span role="cell" class="h-2.5 rounded-r-sm bg-blue" :style="{ width: `${Math.max((t.n / maxType) * 100, 0.6)}%` }" />
              <span role="cell" class="text-right font-mono text-sm tabular-nums text-muted">
                {{ nl(t.n) }} <span class="text-faint">{{ pct(t.n, data.spread.total, 1) }}</span>
              </span>
            </div>
            <div
              v-if="types.rest"
              role="row"
              class="grid grid-cols-[minmax(0,190px)_minmax(0,1fr)_120px] items-center gap-3"
              :title="types.rest.names"
            >
              <span role="cell" class="text-md truncate text-muted">Overig ({{ types.rest.count }} soorten)</span>
              <span role="cell" class="h-2.5 rounded-r-sm bg-line-hover" :style="{ width: `${Math.max((types.rest.n / maxType) * 100, 0.6)}%` }" />
              <span role="cell" class="text-right font-mono text-sm tabular-nums text-muted">
                {{ nl(types.rest.n) }} <span class="text-faint">{{ pct(types.rest.n, data.spread.total, 1) }}</span>
              </span>
            </div>
          </div>
          <div v-else-if="loading" class="h-[200px] animate-pulse rounded-xl bg-sunken" aria-label="Laden" />
        </Panel>

        <Panel title="Risico's" :meta="data ? 'klassen A–E, zoals op de kaart' : undefined">
          <template #actions>
            <span class="text-sm flex items-center gap-2 text-muted">
              <span v-for="c in CLASSES" :key="c" class="flex items-center gap-1">
                <span class="h-2.5 w-2.5 rounded-xs" :class="CLASS_BG[c]" />{{ c.toUpperCase() }}
              </span>
            </span>
          </template>
          <div v-if="data" role="table" aria-label="Panden per risicoklasse" class="flex flex-col gap-3">
            <div v-for="r in RISKS" :key="r.key" role="row" class="flex flex-col gap-1">
              <span class="flex items-baseline gap-2">
                <span role="rowheader" class="text-md font-semibold text-body">{{ r.label }}</span>
                <span class="text-sm ml-auto font-mono text-faint">
                  {{ nl(classified(data.spread.risks[r.key])) }} met een klasse
                  ({{ pct(classified(data.spread.risks[r.key]), data.spread.total) }})
                </span>
              </span>
              <!-- The share of each class among the panden that have one: for bacteriële
                   aantasting that is 3% of all, and a bar over all would be nearly grey. -->
              <span role="cell" class="flex h-3 gap-[2px] overflow-hidden rounded-full">
                <template v-for="c in CLASSES" :key="c">
                  <span
                    v-if="data.spread.risks[r.key][c] > 0"
                    :class="CLASS_BG[c]"
                    :style="{ flexGrow: data.spread.risks[r.key][c], flexBasis: 0, minWidth: '3px' }"
                    :title="`${r.label} ${c.toUpperCase()}: ${nl(data.spread.risks[r.key][c])} panden (${pct(data.spread.risks[r.key][c], classified(data.spread.risks[r.key]), 1)} van de panden met een klasse)`"
                  />
                </template>
              </span>
              <span class="text-xs flex justify-between font-mono text-faint">
                <span v-for="c in CLASSES" :key="c">{{ c.toUpperCase() }} {{ pct(data.spread.risks[r.key][c], classified(data.spread.risks[r.key])) }}</span>
              </span>
            </div>
          </div>
          <div v-else-if="loading" class="h-[200px] animate-pulse rounded-xl bg-sunken" aria-label="Laden" />
        </Panel>
      </div>

      <p class="text-sm text-faint">
        Dit is het standaardmodel. Modelversies naast elkaar vergelijken (2024.1 en 2026.3) vraagt leesrechten die de API nog niet heeft.
      </p>
    </div>
  </AppShell>
</template>
