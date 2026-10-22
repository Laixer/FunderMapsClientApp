<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppShell from '@/components/Layout/AppShell.vue'
import Button from '@/components/Common/Buttons/Button.vue'
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
  verdict,
  type EventKind,
  type Story,
  type StoryEvent,
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
/** The verdict in one sentence, under the address. */
const verdictLine = computed(() => (story.value ? verdict(story.value).join(' · ') : ''))
/** The map's background: the street map, or the aerial photo. */
const aerial = ref(false)
const title = computed(() => (story.value ? pandTitle(story.value) : 'Pand'))
const span = computed(() => lifelineSpan(events.value))
const nl = (n: number) => n.toLocaleString('nl-NL')

/* ---------------------------------------------------------------- facts */

const placeLine = computed(() => {
  const s = story.value
  if (!s) return ''
  const b = s.building
  const a = s.addresses[0]
  return [a ? `${a.postalCode} ${a.city}`.trim() : null, [b?.neighborhood, b?.municipality].filter(Boolean).join(', ') || null]
    .filter(Boolean)
    .join(' · ')
})

/** The pand's facts as chips under the verdict: built, kind, size, height, groundwater, addresses. */
const chips = computed(() => {
  const s = story.value
  if (!s) return []
  const b = s.building
  const m = s.model
  return [
    b?.builtYear ? `gebouwd ${b.builtYear}` : null,
    b?.buildingType ? (BUILDING_TYPE_LABEL[b.buildingType] ?? b.buildingType) : null,
    measure(m?.surfaceArea, 'm²', 0),
    m?.height != null ? `${measure(m.height, 'm')} hoog` : null,
    m?.groundWaterLevel != null ? `grondwater ${measure(m.groundWaterLevel, 'm NAP', 2)}` : null,
    s.addressCount > 1 ? `${nl(s.addressCount)} adressen` : null,
  ].filter((c): c is string => !!c)
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
/**
 * Archive scraps that added nothing (closed as "geen gegevens" or as a
 * duplicate) fold into one line once there are three or more: on a real pand
 * they were half the history, each named by its file (2026-10-22).
 */
const quietOpen = ref(false)
type Row = { key: string; fold: true; count: number; from: string; to: string } | { key: string; fold?: false; e: StoryEvent }
const rows = computed<Row[]>(() => {
  const quiet = shown.value.filter((e) => e.quiet)
  if (quiet.length < 3) return shown.value.map((e) => ({ key: e.key, e }))
  const out: Row[] = []
  for (const e of shown.value) {
    if (e.quiet && e === quiet[0]) {
      out.push({ key: 'fold', fold: true, count: quiet.length, from: eventDate(quiet[quiet.length - 1]!), to: eventDate(e) })
    }
    if (!e.quiet || quietOpen.value) out.push({ key: e.key, e })
  }
  return out
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
  if (events.value.find((e) => e.key === key)?.quiet) quietOpen.value = true
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
      <p v-if="error" class="text-md rounded-xl border border-red bg-red-tint px-4 py-3 text-red">{{ error }}</p>
      <p v-if="loading && !story" class="text-md text-muted">Pand ophalen…</p>

      <template v-if="story">
        <!-- The hero (2026-10-22: "The pand page is really important … feels like an afterthought"):
             who the pand is and what we know about its foundation, in one look — the address large, one
             sentence with the verdict, the facts as chips; on the right the type and the four risks as
             labels in the map's own colours. -->
        <section
          class="grid grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-6 rounded-2xl border border-line bg-surface px-6 py-5"
          aria-label="Het pand"
        >
          <div class="flex min-w-0 flex-col gap-3">
            <div>
              <p class="studio-caption mb-1">Pand <span class="font-mono tracking-normal normal-case text-faint">· BAG {{ bagNumber(story.id) }}</span></p>
              <h1 class="text-4xl flex flex-wrap items-center gap-x-3 font-display font-bold text-ink">
                <span class="min-w-0 break-words">{{ title }}</span>
                <Pill v-if="story.building && !story.building.active" label="niet meer in de BAG" tone="amber" />
              </h1>
              <p class="text-lg mt-1 text-muted">{{ placeLine }}</p>
            </div>
            <p class="text-xl leading-snug text-body" data-verdict>{{ verdictLine }}</p>
            <ul class="flex flex-wrap gap-2" aria-label="Kenmerken">
              <li v-for="c in chips" :key="c" class="text-sm rounded-full border border-line bg-raised px-3 py-1 text-strong">{{ c }}</li>
            </ul>
            <div class="mt-auto flex flex-wrap items-center gap-2 pt-1">
              <RouterLink
                v-if="basis"
                :to="{ name: 'inquiry-view', params: { id: basis.id } }"
                class="text-md rounded-lg border border-line px-3 py-1.5 font-semibold text-blue-ink hover:border-line-hover hover:bg-raised"
              >
                {{ basis.label }} #{{ basis.id }} openen
              </RouterLink>
              <Button :label="copied ? 'Gekopieerd' : 'BAG-id kopiëren'" variant="ghost" @click="copyBag" />
              <Button label="Opnieuw ophalen" variant="ghost" :disabled="loading" @click="load" />
            </div>
          </div>

          <div class="flex flex-col gap-3">
            <div class="rounded-xl bg-raised px-4 py-3">
              <p class="studio-label">Funderingstype volgens het model</p>
              <p class="text-3xl flex flex-wrap items-center gap-2 font-display font-bold text-ink" data-foundation>
                {{ model ? (valueLabel('foundation_type', model.foundationType) ?? 'onbekend') : 'geen uitkomst' }}
                <Pill
                  v-if="model?.foundationTypeReliability"
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
                <template v-else-if="model">geen rapportage: afgeleid uit bouwjaar, buurt en vergelijkbare panden</template>
              </p>
            </div>
            <!-- Like an energy label: the letter large, in the colour the map gives it. -->
            <div class="grid grid-cols-4 gap-2" role="list" aria-label="Risico's volgens het model">
              <div
                v-for="r in MODEL_RISKS"
                :key="r.key"
                role="listitem"
                class="flex flex-col items-center gap-1 rounded-xl border border-line px-2 py-3 text-center"
                :title="model?.[r.key] ? `${r.label}: klasse ${model[r.key]!.toUpperCase()}` : `${r.label}: niet van toepassing`"
              >
                <span
                  class="text-3xl flex h-14 w-14 items-center justify-center rounded-xl font-display font-bold text-ink"
                  :class="model?.[r.key] ? RISK_BG[model[r.key]!] : 'border-2 border-dashed border-line-dashed text-faint'"
                >{{ model?.[r.key]?.toUpperCase() ?? '–' }}</span>
                <span class="text-sm font-semibold leading-tight text-body">{{ r.label }}</span>
                <span class="text-xs text-faint">{{ model?.[r.key] ? (r.reliability ? (reliability(model[r.reliability]) ?? '') : '') : 'n.v.t.' }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Where it stands, and what there is -->
        <div class="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] items-stretch gap-3">
          <div class="relative h-[400px] overflow-hidden rounded-xl border border-line bg-surface">
            <BuildingMap
              v-if="story.building?.outline"
              :outline="story.building.outline"
              :lat="story.building.lat"
              :lon="story.building.lon"
              :aerial="aerial"
            />
            <p v-else class="text-sm flex h-full items-center justify-center text-subtle">Geen omtrek bekend voor dit pand.</p>
            <!-- The street map or the aerial photo (PDOK): the roof, the garden, the neighbours. -->
            <div
              v-if="story.building?.outline"
              class="absolute top-3 left-3 z-10 flex rounded-lg border border-line bg-surface p-0.5 shadow-sm"
              role="group"
              aria-label="Achtergrond van de kaart"
            >
              <button
                v-for="o in [{ key: false, label: 'Kaart' }, { key: true, label: 'Luchtfoto' }]"
                :key="o.label"
                type="button"
                class="text-sm rounded-md px-2.5 py-1 font-semibold"
                :class="aerial === o.key ? 'bg-ink text-white' : 'text-muted hover:text-strong'"
                :aria-pressed="aerial === o.key"
                @click="aerial = o.key"
              >
                {{ o.label }}
              </button>
            </div>
          </div>

          <Panel title="In het kort">
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="s in summary"
                :key="s.label"
                type="button"
                class="flex flex-col items-start gap-0.5 rounded-xl border border-line px-3 py-2.5 text-left hover:border-line-hover hover:bg-raised disabled:hover:bg-transparent"
                :disabled="!s.n"
                @click="pick(s.kind)"
              >
                <span class="text-3xl font-display font-bold tabular-nums" :class="s.n ? 'text-ink' : 'text-ghost'">{{ s.n }}</span>
                <span class="text-md text-body">{{ s.label }}</span>
                <span v-if="s.note" class="text-xs text-faint">{{ s.note }}</span>
              </button>
            </div>
            <div class="mt-3">
              <p class="studio-label">Adressen <span class="font-mono text-faint">{{ story.addressCount }}</span></p>
              <ul class="text-sm mt-1 flex flex-col gap-0.5 text-body">
                <li v-for="a in story.addresses.slice(0, 5)" :key="a.id" class="truncate">{{ addressLine(a) }}</li>
                <li v-if="story.addressCount > 5" class="text-faint">en {{ nl(story.addressCount - 5) }} meer</li>
                <li v-if="!story.addressCount" class="text-faint">geen adressen in de BAG</li>
              </ul>
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
            <template v-for="row in rows" :key="row.key">
            <!-- Several archive scraps that added nothing: one line, opened on request. -->
            <li v-if="row.fold" class="border-b border-divider px-4 py-2 last:border-b-0">
              <button type="button" class="text-sm text-muted hover:text-strong" :aria-expanded="quietOpen" @click="quietOpen = !quietOpen">
                <span class="font-mono text-faint">{{ quietOpen ? '▾' : '▸' }}</span>
                {{ row.count }} dossiers zonder gegevens of dubbel (archiefstukken), {{ row.from }} – {{ row.to }}
              </button>
            </li>
            <li
              v-else
              :id="`event-${row.e.key}`"
              class="grid grid-cols-[104px_96px_minmax(0,1fr)] items-start gap-3 border-b border-divider px-4 py-2.5 last:border-b-0"
              :class="selected === row.e.key ? 'bg-blue-wash' : row.e.current ? 'bg-green-wash/50' : ''"
            >
              <span class="text-sm pt-0.5 font-mono text-faint">{{ eventDate(row.e) }}</span>
              <span class="text-xs flex items-center gap-1.5 pt-1 font-semibold tracking-[0.06em] text-label uppercase">
                <span class="h-2 w-2 shrink-0 rounded-full" :class="row.e.kind === 'built' ? 'bg-ink' : TONE_DOT[row.e.tone]" />{{ KIND_LABEL[row.e.kind] }}
              </span>
              <div class="flex min-w-0 flex-col gap-0.5">
                <p class="text-md flex flex-wrap items-center gap-2">
                  <RouterLink v-if="row.e.to" :to="row.e.to" class="font-semibold text-ink hover:underline">{{ row.e.title }}</RouterLink>
                  <span v-else class="font-semibold text-ink">{{ row.e.title }}</span>
                  <Pill v-if="row.e.pill" :label="row.e.pill.label" :tone="row.e.pill.tone" />
                  <Pill v-if="row.e.current" label="hier rust het model nu op" tone="green" plain />
                </p>
                <p v-if="row.e.meta.length" class="text-sm truncate text-muted">{{ row.e.meta.join(' · ') }}</p>
                <p v-if="row.e.changes?.length" class="text-sm flex flex-wrap items-center gap-x-3 gap-y-1 text-body">
                  <span v-for="c in row.e.changes" :key="c.label" class="flex items-center gap-1.5">
                    {{ c.label }}
                    <span class="rounded px-1.5 font-mono font-bold" :class="RISK_BG[(c.before ?? '').toLowerCase()] ?? 'bg-sunken text-muted'">{{ c.before ?? '–' }}</span>
                    →
                    <span class="rounded px-1.5 font-mono font-bold" :class="RISK_BG[(c.after ?? '').toLowerCase()] ?? 'bg-sunken text-muted'">{{ c.after ?? '–' }}</span>
                  </span>
                </p>
              </div>
            </li>
            </template>
          </ol>
        </Panel>
      </template>
    </div>
  </AppShell>
</template>
