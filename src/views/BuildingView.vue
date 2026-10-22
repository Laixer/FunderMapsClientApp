<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppShell from '@/components/Layout/AppShell.vue'
import Button from '@/components/Common/Buttons/Button.vue'
import PageHeader from '@/components/Common/PageHeader.vue'
import Panel from '@/components/Common/Panel.vue'
import Pill from '@/components/Common/Pill.vue'
import Lifeline from '@/components/Building/Lifeline.vue'
import api from '@/services/fundermaps'
import { describeFailure } from '@/services/fundermaps/errors'
import {
  addressLine,
  bagNumber,
  BUILDING_TYPE_LABEL,
  eventDate,
  lifelineSpan,
  MODEL_RISKS,
  pandTitle,
  RELIABILITY_LABEL,
  RISK_BG,
  storyEvents,
  valueLabel,
  type EventKind,
  type Story,
} from '@/services/buildingStory'
import { rememberPand } from '@/services/recentPanden'
import { TONE_DOT } from '@/services/tone'

// MapLibre is large: the map loads when this page shows it.
const BuildingMap = defineAsyncComponent(() => import('@/components/Mapbox/BuildingMap.vue'))

/**
 * The Pand page (2026-10-22): one pand's whole story. Where it is, what the
 * model says about it now and on what that rests, and everything that
 * happened to it — on a levenslijn and as a list, newest first. Every address
 * in the Studio leads here; the BAG number in Ctrl+K too.
 */
const route = useRoute()
const router = useRouter()
const story = ref<Story | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    story.value = await api.dataops.building(String(route.params.id))
    // An address id finds its pand; the address bar then names the pand, so one pand has one URL.
    if (story.value.id !== route.params.id) void router.replace({ name: 'building', params: { id: story.value.id } })
    // The Panden finder lists the panden you looked at last.
    const a = story.value.addresses[0]
    rememberPand(story.value.id, pandTitle(story.value), a ? `${a.postalCode} ${a.city}`.trim() : (story.value.building?.municipality ?? ''))
  } catch (e) {
    story.value = null
    error.value = describeFailure(e, 'Dit pand kon niet worden opgehaald.')
  } finally {
    loading.value = false
  }
}
watch(
  () => route.params.id,
  (id) => {
    // The replace above: same pand, nothing to fetch again.
    if (route.name === 'building' && id !== story.value?.id) void load()
  },
  { immediate: true },
)

const events = computed(() => (story.value ? storyEvents(story.value) : []))
const title = computed(() => (story.value ? pandTitle(story.value) : 'Pand'))
const span = computed(() => lifelineSpan(events.value))
const nl = (n: number) => n.toLocaleString('nl-NL')

/* ---------------------------------------------------------------- facts */

const placeLine = computed(() => {
  const s = story.value
  if (!s) return ''
  const b = s.building
  const a = s.addresses[0]
  return [
    a ? `${a.postalCode} ${a.city}`.trim() : null,
    b?.builtYear ? `gebouwd ${b.builtYear}` : null,
    b?.buildingType ? (BUILDING_TYPE_LABEL[b.buildingType] ?? b.buildingType) : null,
    [b?.neighborhood, b?.municipality].filter(Boolean).join(', ') || null,
  ]
    .filter(Boolean)
    .join(' · ')
})

const copied = ref(false)
async function copyBag() {
  if (!story.value) return
  try {
    await navigator.clipboard.writeText(story.value.id)
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  } catch {
    /* no clipboard (insecure context): the number is on screen to select */
  }
}

/* ---------------------------------------------------------------- model */

const model = computed(() => story.value?.model ?? null)
/** The rapportage the label rests on, when it is one of this pand's own. */
const basis = computed(() => {
  const id = model.value?.inquiryId
  if (!id) return null
  const r = story.value?.rapportages.find((x) => x.id === id)
  return { id, label: valueLabel('inquiry_type', r?.type ?? model.value?.inquiryType) ?? 'rapportage' }
})
const reliability = (code: string | null | undefined) => (code ? (RELIABILITY_LABEL[code] ?? code) : null)
const measure = (v: number | null | undefined, unit: string, digits = 1) =>
  v == null ? null : `${v.toLocaleString('nl-NL', { maximumFractionDigits: digits })} ${unit}`
const modelFacts = computed(() => {
  const m = model.value
  if (!m) return []
  return [
    { label: 'Bouwjaar', value: m.constructionYear ? String(m.constructionYear) : null, note: reliability(m.constructionYearReliability) },
    { label: 'Hoogte', value: measure(m.height, 'm'), note: null },
    { label: 'Oppervlakte', value: measure(m.surfaceArea, 'm²', 0), note: null },
    { label: 'Grondwaterstand', value: measure(m.groundWaterLevel, 'm NAP', 2), note: 'landelijk watermodel' },
  ].filter((f) => f.value)
})

/* -------------------------------------------------------------- summary */

const summary = computed(() => {
  const s = story.value
  if (!s) return []
  const open = s.dossiers.filter((d) => !d.outcome && !d.inquiryId).length
  const inFm = s.dossiers.filter((d) => d.inquiryId).length
  return [
    { kind: 'rapportage' as EventKind, label: 'Rapportages', n: s.rapportages.length, note: null },
    { kind: 'recovery' as EventKind, label: 'Herstel', n: s.recoveries.length, note: null },
    {
      kind: 'dossier' as EventKind,
      label: 'Dossiers',
      n: s.dossiers.length + s.incidents.length,
      note: [open ? `${open} open` : null, inFm ? `${inFm} in FunderMaps` : null].filter(Boolean).join(' · ') || null,
    },
    { kind: 'model' as EventKind, label: 'Modelwijzigingen', n: s.modelChanges.length, note: null },
  ]
})

/* --------------------------------------------------------------- events */

const FILTERS: { key: 'all' | EventKind; label: string; kinds: EventKind[] }[] = [
  { key: 'all', label: 'Alles', kinds: [] },
  { key: 'rapportage', label: 'Rapportages', kinds: ['rapportage'] },
  { key: 'recovery', label: 'Herstel', kinds: ['recovery'] },
  { key: 'dossier', label: 'Dossiers', kinds: ['dossier', 'incident'] },
  { key: 'model', label: 'Model', kinds: ['model'] },
]
const filter = ref<'all' | EventKind>('all')
const shown = computed(() => {
  const f = FILTERS.find((x) => x.key === filter.value)!
  return f.key === 'all' ? events.value : events.value.filter((e) => f.kinds.includes(e.kind) || e.kind === 'built')
})
const filterCount = (kinds: EventKind[]) => (kinds.length ? events.value.filter((e) => kinds.includes(e.kind)).length : null)

const KIND_LABEL: Record<EventKind, string> = {
  built: 'Gebouwd',
  rapportage: 'Rapportage',
  recovery: 'Herstel',
  dossier: 'Dossier',
  incident: 'Melding',
  model: 'Model',
}

const selected = ref<string | null>(null)
async function select(key: string) {
  selected.value = key
  if (!shown.value.some((e) => e.key === key)) filter.value = 'all'
  await nextTick()
  document.getElementById(`event-${key}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
}
function pick(kind: EventKind) {
  filter.value = FILTERS.find((f) => f.kinds.includes(kind))?.key ?? 'all'
  document.getElementById('pand-events')?.scrollIntoView({ block: 'start', behavior: 'smooth' })
}
</script>

<template>
  <AppShell :crumb="title">
    <div class="flex flex-col gap-3 px-6 py-4">
      <PageHeader kicker="Pand" :title="title" :meta="story ? `BAG ${bagNumber(story.id)}` : undefined">
        <template #badges>
          <Pill v-if="story?.building && !story.building.active" label="niet meer in de BAG" tone="amber" />
        </template>
        <template #purpose>{{ loading && !story ? 'Pand ophalen…' : placeLine }}</template>
        <template #actions>
          <Button v-if="story" :label="copied ? 'Gekopieerd' : 'BAG-id kopiëren'" variant="ghost" @click="copyBag" />
          <Button label="Opnieuw ophalen" :disabled="loading" @click="load" />
        </template>
      </PageHeader>

      <p v-if="error" class="text-md rounded-xl border border-red bg-red-tint px-4 py-3 text-red">{{ error }}</p>

      <template v-if="story">
        <!-- Where it is, what the model says, what there is -->
        <div class="grid grid-cols-[minmax(0,5fr)_minmax(0,4fr)_minmax(0,3fr)] items-stretch gap-3">
          <!-- The map fills its cell: the row is as tall as the model's card. -->
          <div class="min-h-[300px] overflow-hidden rounded-xl border border-line bg-surface">
            <BuildingMap
              v-if="story.building?.outline"
              :outline="story.building.outline"
              :lat="story.building.lat"
              :lon="story.building.lon"
            />
            <p v-else class="text-sm flex h-full items-center justify-center text-subtle">Geen omtrek bekend voor dit pand.</p>
          </div>

          <Panel title="Wat het model nu zegt" :meta="model ? undefined : 'geen modeluitkomst'">
            <div v-if="model" class="flex flex-col gap-3">
              <div>
                <p class="studio-label">Funderingstype</p>
                <p class="text-2xl flex items-center gap-2 font-display font-bold text-ink">
                  {{ valueLabel('foundation_type', model.foundationType) ?? 'onbekend' }}
                  <Pill
                    v-if="model.foundationTypeReliability"
                    :label="reliability(model.foundationTypeReliability)!"
                    :tone="model.foundationTypeReliability === 'established' ? 'green' : 'neutral'"
                  />
                </p>
                <p class="text-sm text-muted">
                  <template v-if="basis">
                    rust op
                    <RouterLink :to="{ name: 'inquiry-view', params: { id: basis.id } }" class="text-blue-ink hover:underline">
                      {{ basis.label }} #{{ basis.id }}
                    </RouterLink>
                  </template>
                  <template v-else>geen rapportage: afgeleid uit bouwjaar, buurt en vergelijkbare panden</template>
                </p>
              </div>
              <div role="table" aria-label="Risico's volgens het model" class="flex flex-col">
                <div v-for="r in MODEL_RISKS" :key="r.key" role="row" class="flex items-center gap-3 border-t border-divider py-1.5">
                  <span role="cell" class="text-md flex-1 text-body">{{ r.label }}</span>
                  <span role="cell" class="text-sm font-mono text-faint">{{ r.reliability ? reliability(model[r.reliability]) ?? '' : '' }}</span>
                  <span
                    role="cell"
                    class="text-sm flex h-6 w-6 items-center justify-center rounded-md font-mono font-bold text-ink"
                    :class="model[r.key] ? RISK_BG[model[r.key]!] : 'border border-dashed border-line-dashed text-faint'"
                    :title="model[r.key] ? `klasse ${model[r.key]!.toUpperCase()}` : 'niet van toepassing'"
                  >{{ model[r.key]?.toUpperCase() ?? '–' }}</span>
                </div>
              </div>
              <dl v-if="modelFacts.length" class="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-divider pt-2">
                <div v-for="f in modelFacts" :key="f.label">
                  <dt class="studio-label">{{ f.label }}</dt>
                  <dd class="text-md font-mono text-strong">{{ f.value }} <span v-if="f.note" class="text-xs font-sans text-faint">{{ f.note }}</span></dd>
                </div>
              </dl>
            </div>
            <p v-else class="text-md text-muted">Het model heeft voor dit pand geen uitkomst.</p>
          </Panel>

          <Panel title="In het kort">
            <div class="flex flex-col">
              <button
                v-for="s in summary"
                :key="s.label"
                type="button"
                class="flex items-baseline gap-2 border-b border-divider py-2 text-left last:border-b-0 hover:bg-raised"
                :disabled="!s.n"
                @click="pick(s.kind)"
              >
                <span class="text-md flex-1 text-body">{{ s.label }}<span v-if="s.note" class="text-sm block text-faint">{{ s.note }}</span></span>
                <span class="text-2xl font-display font-bold tabular-nums" :class="s.n ? 'text-ink' : 'text-ghost'">{{ s.n }}</span>
              </button>
              <div class="mt-3">
                <p class="studio-label">Adressen <span class="font-mono text-faint">{{ story.addressCount }}</span></p>
                <ul class="text-sm mt-1 flex flex-col gap-0.5 text-body">
                  <li v-for="a in story.addresses.slice(0, 5)" :key="a.id" class="truncate">{{ addressLine(a) }}</li>
                  <li v-if="story.addressCount > 5" class="text-faint">en {{ nl(story.addressCount - 5) }} meer</li>
                  <li v-if="!story.addressCount" class="text-faint">geen adressen in de BAG</li>
                </ul>
              </div>
            </div>
          </Panel>
        </div>

        <!-- The levenslijn -->
        <Panel title="Levenslijn" :meta="`${span[0]} – nu`">
          <template #actions>
            <span class="text-sm flex items-center gap-3 text-muted">
              <span class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full" :class="TONE_DOT.green" />in FunderMaps / afgerond</span>
              <span class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full" :class="TONE_DOT.amber" />open</span>
              <span class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full" :class="TONE_DOT.blue" />model bewoog</span>
              <span class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full bg-faint" />gesloten / overig</span>
            </span>
          </template>
          <Lifeline :events="events" :selected="selected" @select="select" />
        </Panel>

        <!-- Everything, newest first -->
        <Panel id="pand-events" title="Alles wat er met dit pand gebeurde" flush>
          <template #actions>
            <div class="flex items-center gap-1" role="tablist" aria-label="Soort gebeurtenis">
              <button
                v-for="f in FILTERS"
                :key="f.key"
                type="button"
                role="tab"
                :aria-selected="filter === f.key"
                class="text-sm rounded-md px-2.5 py-1"
                :class="filter === f.key ? 'bg-green-wash font-semibold text-green-ink' : 'text-muted hover:bg-raised'"
                @click="filter = f.key"
              >
                {{ f.label }}<span v-if="filterCount(f.kinds) !== null" class="ml-1 font-mono text-faint">{{ filterCount(f.kinds) }}</span>
              </button>
            </div>
          </template>
          <ol class="flex flex-col" aria-label="Gebeurtenissen, nieuwste eerst">
            <li
              v-for="e in shown"
              :id="`event-${e.key}`"
              :key="e.key"
              class="grid grid-cols-[104px_96px_minmax(0,1fr)] items-start gap-3 border-b border-divider px-4 py-2.5 last:border-b-0"
              :class="selected === e.key ? 'bg-blue-wash' : e.current ? 'bg-green-wash/50' : ''"
            >
              <span class="text-sm pt-0.5 font-mono text-faint">{{ eventDate(e) }}</span>
              <span class="text-xs flex items-center gap-1.5 pt-1 font-semibold tracking-[0.06em] text-label uppercase">
                <span class="h-2 w-2 shrink-0 rounded-full" :class="e.kind === 'built' ? 'bg-ink' : TONE_DOT[e.tone]" />{{ KIND_LABEL[e.kind] }}
              </span>
              <div class="flex min-w-0 flex-col gap-0.5">
                <p class="text-md flex flex-wrap items-center gap-2">
                  <RouterLink v-if="e.to" :to="e.to" class="font-semibold text-ink hover:underline">{{ e.title }}</RouterLink>
                  <span v-else class="font-semibold text-ink">{{ e.title }}</span>
                  <Pill v-if="e.pill" :label="e.pill.label" :tone="e.pill.tone" />
                  <Pill v-if="e.current" label="hier rust het model nu op" tone="green" plain />
                </p>
                <p v-if="e.meta.length" class="text-sm truncate text-muted">{{ e.meta.join(' · ') }}</p>
                <p v-if="e.changes?.length" class="text-sm flex flex-wrap items-center gap-x-3 gap-y-1 text-body">
                  <span v-for="c in e.changes" :key="c.label" class="flex items-center gap-1.5">
                    {{ c.label }}
                    <span class="rounded px-1.5 font-mono font-bold" :class="RISK_BG[(c.before ?? '').toLowerCase()] ?? 'bg-sunken text-muted'">{{ c.before ?? '–' }}</span>
                    →
                    <span class="rounded px-1.5 font-mono font-bold" :class="RISK_BG[(c.after ?? '').toLowerCase()] ?? 'bg-sunken text-muted'">{{ c.after ?? '–' }}</span>
                  </span>
                </p>
              </div>
            </li>
          </ol>
        </Panel>
      </template>
    </div>
  </AppShell>
</template>
