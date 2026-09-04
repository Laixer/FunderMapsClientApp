<script setup lang="ts">
import { computed, onBeforeMount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppShell from '@/components/Layout/AppShell.vue'
import Button from '@/components/Common/Buttons/Button.vue'
import Callout from '@/components/Common/Callout.vue'
import EmptyState from '@/components/Common/EmptyState.vue'
import Field from '@/components/Common/Field.vue'
import Panel from '@/components/Common/Panel.vue'
import Pill from '@/components/Common/Pill.vue'
import api from '@/services/fundermaps'
import type {
  IReviewDossier,
  IProposedField,
  VerdictOutcome,
  DossierOutcome,
} from '@/services/fundermaps/interfaces/IDataops'
import { describeFailure } from '@/services/fundermaps/errors'
import { FOUNDATION_TYPE_OPTIONS } from '@/services/sampleEnums'
import { useStudioStore } from '@/stores/studio'
import { toastSuccess } from '@/services/toast'

/**
 * Judging one submission.
 *
 * A proposed value cannot be judged on its own, so three things sit together:
 * what the pipeline read, the passage it read it from, and the document itself.
 * If the citation matches the page, the answer is sound — which is exactly how
 * Don worked through 83 of these by hand, and how every real fault in the
 * pipeline has been found so far.
 *
 * Decisions are per value. A document routinely yields six where five are solid
 * and one is a stretch; one verdict for the whole thing would either discard
 * the good ones or wave the bad one through.
 */
const route = useRoute()
const router = useRouter()
const studio = useStudioStore()

const data = ref<IReviewDossier | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const busy = ref<number | null>(null)
const decided = ref<Record<number, VerdictOutcome>>({})
const notes = ref<Record<number, string>>({})
const corrections = ref<Record<number, string>>({})
/** Which document is on screen. A dossier can carry several. */
const shown = ref(0)

/** Closing the dossier as a whole: the note, and whether the request is out. */
const closeNote = ref('')
const closing = ref(false)
const closed = ref<DossierOutcome | null>(null)

/**
 * Load the dossier in the URL. A function rather than a one-off in
 * onBeforeMount because closing a dossier navigates straight to the next
 * one, and vue-router reuses this component for /review/:id → /review/:id —
 * so every piece of per-dossier state is reset here, explicitly.
 */
let openedAt = Date.now()
async function load() {
  loading.value = true
  error.value = null
  data.value = null
  busy.value = null
  decided.value = {}
  notes.value = {}
  corrections.value = {}
  shown.value = 0
  closeNote.value = ''
  closed.value = null
  openedAt = Date.now()
  try {
    data.value = await api.dataops.dossier(Number(route.params.id))
  } catch (e) {
    error.value = describeFailure(e, 'Dit dossier kon niet worden geladen.')
  } finally {
    loading.value = false
  }
}

onBeforeMount(load)
watch(
  () => route.params.id,
  (id, prev) => {
    if (id !== prev && route.name === 'review-dossier') load()
  },
)

/**
 * Dutch labels for the fields the pipeline can fill. Keys are the
 * `report.inquiry_sample` column names (identifiers are English everywhere;
 * only what a person reads is Dutch), plus `recovery_note`, which has no column.
 */
const FIELD_LABEL: Record<string, string> = {
  foundation_type: 'Funderingstype',
  built_year: 'Bouwjaar',
  foundation_quality: 'Funderingskwaliteit',
  recovery_advised: 'Herstel geadviseerd',
  recovery_note: 'Hersteladvies (toelichting)',
  follow_up_note: 'Vervolgadvies (onderzoek / monitoring)',
  enforcement_term: 'Handhavingstermijn',
  groundwater_level: 'Grondwaterstand',
  wood_level: 'Bovenkant hout',
  pile_head_level: 'Bovenkant paal',
  pile_tip_level: 'Paalpuntniveau',
  concrete_charger_length: 'Lengte betonoplanger',
  pile_diameter_top: 'Paaldiameter kop',
  pile_diameter_bottom: 'Paaldiameter punt',
  pile_distance_length: 'Paalafstand (h.o.h.)',
  wood_type: 'Houtsoort',
  wood_penetration_depth: 'Indringingsdiepte hout',
  wood_encroachment: 'Houtaantasting',
  mason_level: 'Onderkant metselwerk',
  foundation_depth: 'Aanlegniveau fundering',
  groundlevel: 'Maaiveld',
  cpt: 'Sondering',
  damage_cause: 'Schadeoorzaak',
  damage_characteristics: 'Schadebeeld',
  crack_facade_front_type: 'Scheuren voorgevel',
  crack_facade_back_type: 'Scheuren achtergevel',
  crack_indoor_type: 'Scheuren inpandig',
  skewed_parallel: 'Lintvoegmeting',
  skewed_perpendicular: 'Loodmeting',
  threshold_front_level: 'Drempelniveau voorzijde',
  threshold_back_level: 'Drempelniveau achterzijde',
  settlement_speed: 'Zakkingssnelheid',
}

/** Unit shown next to a value, so -2.324 is read as metres NAP and not millimetres. */
const FIELD_UNIT: Record<string, string> = {
  groundwater_level: 'm t.o.v. NAP',
  wood_level: 'm t.o.v. NAP',
  pile_head_level: 'm t.o.v. NAP',
  pile_tip_level: 'm t.o.v. NAP',
  concrete_charger_length: 'm',
  pile_diameter_top: 'mm',
  pile_diameter_bottom: 'mm',
  pile_distance_length: 'm',
  wood_penetration_depth: 'mm',
  mason_level: 'm t.o.v. NAP',
  foundation_depth: 'm t.o.v. NAP',
  groundlevel: 'm t.o.v. NAP',
  threshold_front_level: 'm t.o.v. NAP',
  threshold_back_level: 'm t.o.v. NAP',
  skewed_parallel: 'mm/m',
  skewed_perpendicular: 'mm/m',
  settlement_speed: 'mm/jaar',
}

/** Enum-coded values, shown in Dutch. The code is what gets stored. */
const VALUE_LABEL: Record<string, Record<string, string>> = {
  foundation_quality: {
    bad: 'slecht',
    mediocre: 'matig',
    tolerable: 'redelijk',
    good: 'goed',
    mediocre_good: 'matig tot goed',
    mediocre_bad: 'matig tot slecht',
  },
  enforcement_term: {
    term5: '≤ 5 jaar',
    term10: '≤ 10 jaar',
    term15: '≤ 15 jaar',
    term20: '≤ 20 jaar',
    term25: '≤ 25 jaar',
    term30: '≤ 30 jaar',
    term40: '> 30 jaar',
    term05: '0–5 jaar',
    term510: '5–10 jaar',
    term1020: '10–20 jaar',
  },
  recovery_advised: { true: 'ja', false: 'nee' },
  wood_type: { pine: 'grenen', spruce: 'vuren' },
  crack_facade_front_type: { none: 'geen', nil: 'geen', small: 'licht', mediocre: 'matig', big: 'ernstig' },
  crack_facade_back_type: { none: 'geen', nil: 'geen', small: 'licht', mediocre: 'matig', big: 'ernstig' },
  crack_indoor_type: { none: 'geen', nil: 'geen', small: 'licht', mediocre: 'matig', big: 'ernstig' },
  wood_encroachment: {
    fungus_infection: 'schimmelaantasting',
    bio_infection: 'bacteriële aantasting',
    bio_fungus_infection: 'bacteriële + schimmelaantasting',
  },
  damage_cause: {
    drainage: 'ontwatering',
    construction_flaw: 'constructiefout',
    drystand: 'droogstand',
    overcharge: 'overbelasting',
    overcharge_negative_cling: 'overbelasting + negatieve kleef',
    negative_cling: 'negatieve kleef',
    bio_infection: 'bacteriële aantasting',
    fungus_infection: 'schimmelaantasting',
    bio_fungus_infection: 'bacteriële + schimmelaantasting',
    foundation_flaw: 'funderingsfout',
    construction_heave: 'opdrukken constructie',
    subsidence: 'zetting',
    vegetation: 'begroeiing',
    gas: 'gas',
    vibrations: 'trillingen',
    partial_foundation_recovery: 'gedeeltelijk funderingsherstel',
    japanese_knotweed: 'Japanse duizendknoop',
    groundwater_level_reduction: 'grondwaterstandverlaging',
  },
  damage_characteristics: {
    jamming_door_window: 'klemmende deuren/ramen',
    crack: 'scheuren',
    skewed: 'scheefstand',
    crawlspace_flooding: 'water in kruipruimte',
    threshold_above_subsurface: 'dorpel boven maaiveld',
    threshold_below_subsurface: 'dorpel onder maaiveld',
    crooked_floor_wall: 'scheve vloer/wand',
  },
}
const displayValue = (f: IProposedField) =>
  f.value == null ? '—' : (VALUE_LABEL[f.field]?.[f.value] ?? f.value)

const open = computed(() => (data.value?.fields ?? []).filter((f) => !decided.value[f.id]))

/**
 * Open values grouped by address. A funderingsonderzoek covers a block; the
 * report's own tables are per address, and so is report.inquiry_sample. The
 * document-level group ("het rapport") comes first, then each address in the
 * order the API returns them.
 */
const openByAddress = computed(() => {
  const groups = new Map<string, IProposedField[]>()
  for (const f of open.value) {
    const key = f.addressText ?? ''
    groups.set(key, [...(groups.get(key) ?? []), f])
  }
  return [...groups.entries()]
    .sort(([a], [b]) => (a === '' ? -1 : b === '' ? 1 : a.localeCompare(b)))
    .map(([address, fields]) => ({
      address,
      resolved: fields.some((f) => f.addressId),
      fields,
    }))
})
const settled = computed(() => (data.value?.fields ?? []).filter((f) => decided.value[f.id]))

/** Whether the pipeline has read this dossier at all. */
const wasRead = computed(() => (data.value?.artifacts ?? []).some((a) => a.pages.length > 0))
/**
 * Read, and found nothing. The most common shape on the wood corpus (55% of
 * documents are photographs) and the one this screen exists for: a person
 * looks at the document and either throws the dossier out or enters it by hand.
 */
const nothingProposed = computed(
  () => !loading.value && !!data.value && data.value.fields.length === 0,
)
/** The model was sure and quoted a passage. Still a proposal — nothing is accepted for you. */
const isSure = (f: IProposedField) =>
  Number(f.confidence ?? 0) >= 0.95 && !!f.evidence?.trim() && !isInferred(f)

/** The model reasoned rather than read. Said plainly, not hidden. */
const isInferred = (f: IProposedField) => /^\s*afgeleid\s*:/i.test(f.evidence ?? '')

/**
 * Close the dossier. `rejected` is the cat picture, the empty scan, the
 * report filed under the wrong address; `duplicate` the same thing twice.
 * Both need a word on why — that note is the most useful thing collected here.
 */
async function closeDossier(outcome: DossierOutcome) {
  if (!data.value) return
  closing.value = true
  try {
    await api.dataops.close(data.value.dossier.id, {
      outcome,
      note: closeNote.value.trim() || null,
    })
    closed.value = outcome
    void studio.refreshCounts(null)
    await openNext(data.value.dossier.id, outcome)
  } catch (e) {
    error.value = describeFailure(e, 'Het dossier kon niet worden gesloten.')
  } finally {
    closing.value = false
  }
}

/** Values a person has taken over: what the commit will write. */
const taken = computed(() => settled.value.filter((f) => decided.value[f.id] === 'confirmed' || decided.value[f.id] === 'corrected'))
const committing = ref(false)

/**
 * Overnemen als rapportage: the judged values become an inquiry + samples, the
 * document enters inquiry-report/, the dossier leaves the queue -- and the
 * next one opens.
 */
async function commitDossier() {
  if (!data.value) return
  committing.value = true
  try {
    const r = await api.dataops.commit(data.value.dossier.id)
    closed.value = 'accepted'
    void studio.refreshCounts(null)
    toastSuccess(`Rapportage #${r.inquiryId} aangemaakt met ${r.samples} adres${r.samples === 1 ? '' : 'sen'}.`)
    await openNext(data.value.dossier.id, 'accepted')
  } catch (e) {
    error.value = describeFailure(e, 'Het dossier kon niet als rapportage worden overgenomen.')
  } finally {
    committing.value = false
  }
}

/* -------------------------------------------------------------- timeline */

const KIND_LABEL: Record<string, string> = {
  received: 'ontvangen',
  extraction: 'gelezen',
  finding: 'controle',
  verdict: 'oordeel',
  remark: 'notitie',
  question: 'vraag',
  reply: 'antwoord',
  status: 'status',
}

const entries = computed(() => data.value?.entries ?? [])
const remarkText = ref('')
const remarkBusy = ref(false)

/** Append a note to the timeline and show it without a reload. */
async function addRemark() {
  const text = remarkText.value.trim()
  if (!text || !data.value) return
  remarkBusy.value = true
  try {
    await api.dataops.remark(data.value.dossier.id, text)
    data.value.entries = [
      ...data.value.entries,
      {
        id: -Date.now(),
        at: new Date().toISOString(),
        kind: 'remark',
        actorKind: 'reviewer',
        actor: null,
        text,
        visibleToMelder: false,
      },
    ]
    remarkText.value = ''
  } catch (e) {
    error.value = describeFailure(e, 'De notitie kon niet worden opgeslagen.')
  } finally {
    remarkBusy.value = false
  }
}

function entryWhen(at: string): string {
  return new Date(at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) +
    ' ' + new Date(at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
}

const OUTCOME_LABEL: Record<DossierOutcome, string> = {
  accepted: 'afgehandeld',
  rejected: 'afgewezen',
  duplicate: 'als duplicaat gesloten',
  no_data: 'gesloten: geen gegevens',
}

/**
 * Straight on to the next one. Closing a dossier is the end of a decision,
 * not of a session: the reviewer's next move is always "the next oldest", and
 * a trip through the list between every two dossiers is what breaks the pace
 * (Yorick, 2026-08-29). The list is still one click away if they want it.
 */
async function openNext(closedId: number, outcome: DossierOutcome) {
  toastSuccess(`Dossier #${closedId} ${OUTCOME_LABEL[outcome]}.`)
  try {
    const next = (await api.dataops.queue({ limit: 5 })).find((r) => r.id !== closedId)
    if (next) {
      await router.push({ name: 'review-dossier', params: { id: next.id } })
      return
    }
  } catch {
    // Falling back to the list is fine; the close itself already succeeded.
  }
  await router.push({ name: 'review-queue' })
}
/** The source was not allowed to establish this field — a QuickScan quoting us back. */
const isRefused = (f: IProposedField) => f.state === 'rejected'

const metaLine = computed(() => {
  const d = data.value?.dossier
  if (!d) return ''
  const when = new Date(d.receivedAt).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return [d.externalRef ?? 'zonder kenmerk', `via ${d.channel}`, `ontvangen ${when}`].join(' · ')
})

const artifacts = computed(() => data.value?.artifacts ?? [])
const current = computed(() => artifacts.value[shown.value] ?? null)
const isImage = (mime: string | null) => !!mime && mime.startsWith('image/')

/**
 * Which document a value came from. Selecting a value shows its document, so a
 * reviewer never has to work out which of four attachments is being quoted.
 */
function focus(f: IProposedField) {
  const i = artifacts.value.findIndex((a) => a.id === f.artifactId)
  if (i >= 0) shown.value = i
}

/** Signed links expire; opening in a new tab keeps the review screen intact. */
function openArtifact(link: string) {
  window.open(link, '_blank', 'noopener')
}

async function decide(f: IProposedField, outcome: VerdictOutcome) {
  busy.value = f.id
  try {
    await api.dataops.verdict({
      fieldId: f.id,
      outcome,
      finalValue: outcome === 'corrected' ? (corrections.value[f.id] ?? null) : null,
      note: notes.value[f.id]?.trim() || null,
      reviewSeconds: Math.round((Date.now() - openedAt) / 1000),
    })
    decided.value = { ...decided.value, [f.id]: outcome }
    // Move to the next open value's document straight away: the reviewer's
    // next decision is almost always about a different page.
    const next = open.value.find((o) => o.id !== f.id)
    if (next) focus(next)
  } catch (e) {
    error.value = describeFailure(e, 'Het oordeel kon niet worden opgeslagen.')
  } finally {
    busy.value = null
  }
}
</script>

<template>
  <AppShell :crumb="data?.dossier.subject ?? 'Controle'" fill>
    <!-- One header, then two columns that fill the rest of the screen: the
         document on the left, the values on the right. Judging a citation means
         looking at the page it came from, so the page is never a click away. -->
    <header
      v-if="data"
      class="flex shrink-0 items-center gap-3 border-b border-line bg-surface px-6 py-2.5"
    >
      <h1 class="text-lg min-w-0 truncate font-bold text-ink">
        {{ data.dossier.subject ?? 'Dossier' }}
      </h1>
      <Pill v-if="closed" :label="`gesloten: ${closed}`" tone="neutral" plain />
      <Pill v-else-if="nothingProposed" label="geen voorstellen" tone="red" plain />
      <Pill v-else :label="`${open.length} te beoordelen`" tone="blue" plain />
      <p class="text-sm min-w-0 flex-1 truncate font-mono text-faint">{{ metaLine }}</p>
      <Button label="Terug naar de lijst" @click="router.push({ name: 'review-queue' })" />
    </header>

    <div
      v-if="error"
      class="text-md shrink-0 border-b border-red bg-red-tint px-6 py-2.5 text-red"
    >
      {{ error }}
    </div>

    <div class="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_var(--spacing-inspector)]">
      <!-- ------------------------------------------------------- document -->
      <section class="flex min-w-0 flex-col border-r border-line bg-sunken">
        <!-- Tabs only when there is something to choose between. -->
        <div
          v-if="artifacts.length > 1"
          class="flex shrink-0 items-center gap-1.5 border-b border-line bg-surface px-4 pt-2.5"
        >
          <button
            v-for="(a, i) in artifacts"
            :key="a.id"
            type="button"
            class="text-md max-w-[220px] truncate border-b-2 px-3 pt-1.5 pb-2.5"
            :class="
              i === shown
                ? 'border-green font-bold text-ink'
                : 'border-transparent font-medium text-subtle hover:text-strong'
            "
            @click="shown = i"
          >
            {{ a.originalFilename ?? `Document ${i + 1}` }}
          </button>
        </div>

        <div class="min-h-0 flex-1">
          <img
            v-if="current && isImage(current.mimeType)"
            :src="current.accessLink"
            :alt="current.originalFilename ?? 'Brondocument'"
            class="h-full w-full object-contain"
          />
          <iframe
            v-else-if="current"
            :src="current.accessLink"
            class="h-full w-full border-0"
            :title="current.originalFilename ?? 'Brondocument'"
          />
          <EmptyState v-else>Geen document bij dit dossier.</EmptyState>
        </div>

        <div
          v-if="current"
          class="text-sm flex shrink-0 items-center gap-3 border-t border-line bg-surface px-4 py-2 text-faint"
        >
          <span class="min-w-0 flex-1 truncate font-mono">{{ current.originalFilename }}</span>
          <span>{{ current.pageCount }} pag.</span>
          <span>{{ { text: 'tekst', vision: 'afbeelding', document: 'document' }[current.lane] ?? current.lane }}</span>
          <span v-if="data?.fields[0]" class="font-mono">{{ data.fields[0].model }}</span>
          <button
            type="button"
            class="font-medium text-blue-ink underline-offset-2 hover:underline"
            @click="openArtifact(current.accessLink)"
          >
            Nieuw tabblad
          </button>
        </div>
      </section>

      <!-- --------------------------------------------------------- values -->
      <aside class="flex min-h-0 flex-col overflow-y-auto bg-surface">
        <div class="flex flex-col gap-3 p-4">
          <EmptyState v-if="loading">Dossier ophalen…</EmptyState>

          <Callout v-else-if="closed" tone="neutral" title="Dossier gesloten">
            Gesloten als <strong>{{ closed }}</strong>. Het staat niet meer in de controlelijst.
          </Callout>

          <Callout
            v-else-if="nothingProposed && !wasRead"
            tone="amber"
            title="Nog niet gelezen"
          >
            De pipeline heeft dit dossier nog niet verwerkt. Bekijk het document zelf, of wacht
            tot het gelezen is.
          </Callout>

          <Callout v-else-if="nothingProposed" tone="red" title="De pipeline vond niets">
            Het document is gelezen, maar er is geen enkele waarde uit gehaald. Bekijk het zelf:
            hoort het hier niet thuis, sluit het dossier dan hieronder. Bevat het wél gegevens,
            voer ze dan in via een nieuwe rapportage.
          </Callout>

          <Callout v-else-if="open.length === 0" tone="green" title="Alles beoordeeld">
            Er staan geen voorstellen meer open op dit dossier.
          </Callout>

          <template v-for="group in openByAddress" :key="group.address">
            <div
              v-if="openByAddress.length > 1"
              class="flex items-center gap-2 pt-2"
            >
              <span class="studio-label">{{ group.address || 'HET RAPPORT' }}</span>
              <Pill
                v-if="group.address"
                :label="group.resolved ? 'adres herkend' : 'adres niet herkend'"
                :tone="group.resolved ? 'green' : 'amber'"
                plain
              />
            </div>
          <Panel
            v-for="f in group.fields"
            :key="f.id"
            :caption="(FIELD_LABEL[f.field] ?? f.field).toUpperCase()"
            :meta="f.confidence ?? undefined"
          >
            <div class="flex flex-col gap-3" @focusin="focus(f)" @click="focus(f)">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-2xl font-display font-bold text-ink">{{ displayValue(f) }}</span>
                <span v-if="FIELD_UNIT[f.field] && f.value != null" class="text-md text-muted">
                  {{ FIELD_UNIT[f.field] }}
                </span>
                <Pill v-if="isRefused(f)" label="bron niet toelaatbaar" tone="red" />
                <Pill v-else-if="isInferred(f)" label="afgeleid" tone="amber" />
                <Pill v-else-if="isSure(f)" label="hoge zekerheid" tone="green" />
              </div>

              <!-- The citation is what is being judged, not the value. -->
              <p class="text-md border-l-2 border-line-strong pl-3 text-muted">
                {{ f.evidence ?? 'Geen citaat meegegeven.' }}
              </p>

              <Callout
                v-if="isRefused(f)"
                tone="red"
                title="Dit document mag dit veld niet vaststellen"
              >
                Een QuickScan of funderingsrisicorapport toont FunderMaps-gegevens.
              </Callout>

              <Field
                v-if="f.field === 'foundation_type'"
                v-model="corrections[f.id]"
                kind="select"
                label="Andere waarde"
                :options="FOUNDATION_TYPE_OPTIONS"
              />
              <Field v-else v-model="corrections[f.id]" label="Andere waarde" />

              <Field
                v-model="notes[f.id]"
                kind="textarea"
                :rows="2"
                label="Toelichting"
                hint="Waarom klopt het niet? Dit stuurt de volgende versie."
              />

              <div class="flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  label="Overnemen"
                  :disabled="busy === f.id || isRefused(f)"
                  @click="decide(f, 'confirmed')"
                />
                <Button
                  label="Aanpassen"
                  :disabled="busy === f.id || !corrections[f.id]"
                  @click="decide(f, 'corrected')"
                />
                <Button
                  variant="danger"
                  label="Afkeuren"
                  :disabled="busy === f.id"
                  @click="decide(f, 'rejected')"
                />
              </div>
            </div>
          </Panel>
          </template>

          <Panel v-if="settled.length" caption="BEOORDEELD" :meta="String(settled.length)">
            <ul class="flex flex-col gap-2">
              <li
                v-for="f in settled"
                :key="f.id"
                class="text-md flex gap-2.5 border-b border-canvas pb-2 last:border-b-0 last:pb-0"
              >
                <span aria-hidden="true" class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green" />
                <span class="min-w-0">
                  <span class="block font-semibold text-body">
                    {{ FIELD_LABEL[f.field] ?? f.field }} — {{ f.value }}
                  </span>
                  <span class="block text-muted">{{ decided[f.id] }}</span>
                </span>
              </li>
            </ul>
          </Panel>

          <!-- The dossier's timeline: everything that happened, in order. The
               melder's status page shows the visible subset of these same rows,
               so reviewer and melder can never see two different stories. -->
          <Panel v-if="entries.length" caption="VERLOOP" :meta="String(entries.length)">
            <ul class="flex flex-col gap-1.5">
              <li v-for="e in entries" :key="e.id" class="text-md flex gap-2.5">
                <span class="text-sm w-[84px] shrink-0 font-mono text-faint">{{ entryWhen(e.at) }}</span>
                <span class="min-w-0">
                  <span class="text-sm mr-1.5 font-semibold uppercase text-label">{{ KIND_LABEL[e.kind] ?? e.kind }}</span>
                  <span class="break-words text-muted">{{ e.text }}</span>
                </span>
              </li>
            </ul>
            <div class="mt-3 flex gap-2">
              <input
                v-model="remarkText"
                type="text"
                class="studio-control flex-1 rounded-md border border-line bg-sunken px-2 py-1.5"
                placeholder="Notitie voor het dossier (intern)"
                aria-label="Notitie toevoegen"
                @keydown.enter="addRemark"
              />
              <Button label="Noteer" :disabled="remarkBusy || !remarkText.trim()" @click="addRemark" />
            </div>
          </Panel>

          <!-- Closing the whole dossier. Always available, because "this is
               not about anything" is a judgement about the document, not
               about one of its values. -->
          <Panel v-if="!loading && data && !closed" caption="DOSSIER SLUITEN">
            <div class="flex flex-col gap-3">
              <Field
                v-model="closeNote"
                kind="textarea"
                :rows="2"
                label="Reden"
                hint="Verplicht bij afwijzen of duplicaat. Kort is prima: ‘foto van een kat’."
              />
              <div class="flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  label="Overnemen als rapportage"
                  :disabled="committing || closing || open.length > 0 || !taken.length"
                  :title="open.length > 0 ? 'Beoordeel eerst alle voorstellen' : !taken.length ? 'Neem minstens een waarde over' : ''"
                  @click="commitDossier"
                />
                <Button
                  label="Geen gegevens"
                  :disabled="closing || committing"
                  @click="closeDossier('no_data')"
                />
                <Button
                  variant="danger"
                  label="Afwijzen"
                  :disabled="closing || !closeNote.trim()"
                  @click="closeDossier('rejected')"
                />
                <Button
                  label="Duplicaat"
                  :disabled="closing || !closeNote.trim()"
                  @click="closeDossier('duplicate')"
                />
                <Button
                  label="Afgehandeld"
                  :disabled="closing || open.length > 0"
                  @click="closeDossier('accepted')"
                />
              </div>
            </div>
          </Panel>
        </div>
      </aside>
    </div>
  </AppShell>
</template>
