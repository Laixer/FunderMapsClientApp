<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { keyLabel } from '@/services/shortcuts'
import { useI18n } from 'vue-i18n'
import cloneDeep from 'lodash-es/cloneDeep'

import Field from '@/components/Common/Field.vue'
import Panel from '@/components/Common/Panel.vue'
import Pill from '@/components/Common/Pill.vue'
import SampleField from '@/components/Inquiry/SampleField.vue'

import type {
  IInquirySample,
  IInquirySampleInput,
} from '@/services/fundermaps/interfaces/IInquirySample'
import {
  builtYearToSend,
  countFilledInSection,
  SAMPLE_SECTIONS,
  type SampleSectionDef,
} from '@/services/sampleFields'
import type { SampleFinding } from '@/services/sampleValidation'
import {
  confirm as confirmEntry,
  isConfirmed,
  summarise,
  type ProvenanceKey,
  type SampleProvenance,
} from '@/services/sampleProvenance'
import { formatAddress } from '@/utils/address'
import { useAddressStore } from '@/stores/address'
import { useSessionStore } from '@/stores/session'

/**
 * One address's worth of observations, autosaved as you type.
 *
 * The Save button is gone. It was the app's biggest source of lost work: a
 * sixty-field form, a terrace of near-identical houses, and a click on the next
 * address that silently discarded everything typed into the current one. Now
 * every edit schedules a save 600ms later and the header says when the last one
 * landed — so switching address, leaving the page or closing the laptop are all
 * safe by construction rather than by dialog.
 *
 * The parent owns the writing (it holds the inquiry id and the request); this
 * owns the editing. `flush()` is exposed so navigation can force a pending save
 * out before it leaves, without ever *blocking* on one.
 */
const props = defineProps<{
  sample: IInquirySample
  /** Cross-field findings for this address, keyed by nothing — see `warningFor`. */
  findings?: SampleFinding[]
  /** True while a write for this sample is in flight. */
  saving?: boolean
}>()

/**
 * Which fields were carried over from another address rather than entered
 * here. Owned by the parent so it outlives switching between samples; phase 2
 * persists it on the sample itself.
 */
const provenance = defineModel<SampleProvenance>('provenance', { default: () => ({}) })

const emit = defineEmits<{
  save: [data: IInquirySampleInput]
  /**
   * The current, possibly unsaved, state of the form. Fires on every edit so
   * the parent can judge what the person is *typing*, not only what the
   * server last accepted — a write that bounces (#1012) must still leave its
   * warning on screen.
   */
  draft: [data: IInquirySample]
}>()

const addressStore = useAddressStore()
const sessionStore = useSessionStore()
const { t } = useI18n()

/** Editable copy. Reset whenever the parent passes a different sample. */
const form = ref<IInquirySample>(cloneDeep(props.sample))

/** The built year this address had when the form opened; see `builtYearToSend`. */
let openedBuiltYear = props.sample.builtYear

/** How long to wait after the last keystroke before writing. */
const AUTOSAVE_MS = 600

let timer: ReturnType<typeof setTimeout> | null = null
const dirty = ref(false)

function payload(): IInquirySampleInput {
  const { id, inquiry, building, createDate, updateDate, deleteDate, ...input } = form.value
  void id
  void inquiry
  void building
  void createDate
  void updateDate
  void deleteDate
  // The form edits a year; the column holds a date. Decided here, where the
  // body is made, against what the server holds at this moment.
  input.builtYear = builtYearToSend(input.builtYear, props.sample.builtYear, openedBuiltYear)
  return input as IInquirySampleInput
}

function schedule() {
  dirty.value = true
  emit('draft', { ...form.value })
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    timer = null
    dirty.value = false
    failed.value = false
    emit('save', payload())
  }, AUTOSAVE_MS)
}

/** Write now rather than in 600ms. Used by ⌘S and before navigating away. */
function flush() {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  if (!dirty.value) return
  dirty.value = false
  failed.value = false
  emit('save', payload())
}

/**
 * The parent's write failed: what is on screen is not on the server.
 *
 * Without this the pill stayed green on "Opgeslagen" after a failed autosave,
 * and the save shortcut had nothing left to send, so there was no way to try
 * again short of changing a value. Only for the sample this form is showing: a
 * late failure for the previous one must not mark this one.
 */
const failed = ref(false)
function markUnsaved(sampleId: number) {
  if (sampleId !== props.sample.id) return
  dirty.value = true
  failed.value = true
}

defineExpose({ flush, markUnsaved, hasPendingEdits: computed(() => dirty.value) })

watch(
  () => props.sample.id,
  () => {
    // Switching address must not carry the outgoing address's pending write
    // into the incoming one's payload.
    flush()
    failed.value = false
    form.value = cloneDeep(props.sample)
    openedBuiltYear = props.sample.builtYear
  },
)

/**
 * Single write path for every registry-driven field. The per-field value union
 * on IInquirySample cannot be expressed generically, so the cast is collapsed
 * here — one documented place instead of one per field. Editing a field also
 * ends its inherited status: the user has just made the value their own.
 */
function setField(key: keyof IInquirySample, value: unknown) {
  ;(form.value as unknown as Record<string, unknown>)[key] = value
  clearProvenance(key as ProvenanceKey)
  schedule()
}

function onNoteInput(value: string | null | undefined) {
  form.value.note = value ?? null
  clearProvenance('note')
  schedule()
}

function clearProvenance(key: ProvenanceKey) {
  if (!provenance.value[key]) return
  const next = { ...provenance.value }
  delete next[key]
  provenance.value = next
}

function confirmField(key: ProvenanceKey) {
  const entry = provenance.value[key]
  if (!entry) return
  provenance.value = {
    ...provenance.value,
    [key]: confirmEntry(entry, sessionStore.currentUser?.id ?? null),
  }
}

function confirmSection(keys: readonly ProvenanceKey[]) {
  const by = sessionStore.currentUser?.id ?? null
  const next = { ...provenance.value }
  for (const key of keys) {
    const entry = next[key]
    if (entry && !isConfirmed(entry)) next[key] = confirmEntry(entry, by)
  }
  provenance.value = next
}

const sectionSummary = computed(() => {
  const out: Record<string, { tracked: number; unconfirmed: number }> = {}
  for (const section of SAMPLE_SECTIONS) {
    out[section.title] = summarise(
      provenance.value,
      section.fields.map((f) => f.key),
    )
  }
  return out
})

/** Whether the field at `index` shares its grid row with a labelled control. */
function besideControl(section: SampleSectionDef, index: number): boolean {
  const columns = section.columns ?? 2
  const start = index - (index % columns)
  return section.fields.slice(start, start + columns).some((field) => field.kind !== 'bool')
}

/**
 * Which finding, if any, belongs on a given field. Matched on the field's key
 * appearing in the finding's id, which is how `sampleValidation` names them —
 * a finding about two fields lights up both, which is the point.
 */
function findingFor(key: string): SampleFinding | null {
  return props.findings?.find((f) => f.id.toLowerCase().includes(key.toLowerCase())) ?? null
}

/**
 * Where each finding's sentence is printed: under the first field it names, in
 * the order of the form. The others it names get the amber frame alone; the
 * sentence under every one of them was ten copies in Scheuren, and it also
 * stands in "Controleer dit". A yes/no chip shows no sentence, so it is never
 * the one that carries it.
 */
const sentenceAt = computed(() => {
  const at = new Map<string, string>()
  for (const section of SAMPLE_SECTIONS) {
    for (const field of section.fields) {
      const finding = field.kind === 'bool' ? null : findingFor(field.key)
      if (finding && !at.has(finding.id)) at.set(finding.id, field.key)
    }
  }
  return at
})

function warningFor(key: string): string | null {
  const finding = findingFor(key)
  return finding && sentenceAt.value.get(finding.id) === key ? finding.message : null
}

// `note` sits outside the registry (it renders as a textarea in its own
// section), so its badge is wired up by hand rather than through SampleField.
const noteProvenance = computed(() => provenance.value.note)
const notePending = computed(
  () => noteProvenance.value !== undefined && !isConfirmed(noteProvenance.value),
)
const noteInheritedFrom = computed(() =>
  noteProvenance.value?.source.kind === 'inherited'
    ? noteProvenance.value.source.fromAddress
    : null,
)

const addressLabel = computed(() => formatAddress(addressStore.cache[form.value.address]))

/** What the header pill says about the last write. */
const saveState = computed(() => {
  if (props.saving) return { label: 'Opslaan…', tone: 'blue' as const }
  if (failed.value) return { label: `Niet opgeslagen · ${keyLabel('⌘S')} probeert opnieuw`, tone: 'red' as const }
  if (dirty.value) return { label: 'Niet opgeslagen', tone: 'amber' as const }
  return { label: 'Opgeslagen', tone: 'green' as const }
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <header class="flex items-center gap-3">
      <div class="min-w-0">
        <h2 class="text-3xl font-display font-bold break-words text-ink">{{ addressLabel }}</h2>
        <p v-if="form.building" class="text-xs font-mono text-faint">{{ form.building }}</p>
      </div>
      <!-- The save state is a fact about your work, so it sits next to the
           address it belongs to rather than in a corner of the chrome. -->
      <Pill class="ml-auto" :label="saveState.label" :tone="saveState.tone" />
    </header>

    <!-- Sections, fields, labels, units, options and input constraints all come
         from SAMPLE_SECTIONS — the same descriptors the reviewer overview and
         the read-only view render from. -->
    <Panel v-for="section in SAMPLE_SECTIONS" :key="section.title">
      <template #header>
        <span class="studio-caption">{{ section.title.toUpperCase() }}</span>
        <span class="text-xs font-mono text-label">
          {{ countFilledInSection(form, section) }} van {{ section.fields.length }} gevuld
        </span>
      </template>

      <template v-if="sectionSummary[section.title]!.unconfirmed" #actions>
        <span class="text-sm text-muted">
          {{
            t('sample.provenance.sectionPending', {
              count: sectionSummary[section.title]!.unconfirmed,
            })
          }}
        </span>
        <button
          type="button"
          class="text-sm font-semibold text-green-ink underline underline-offset-2"
          @click="confirmSection(section.fields.map((f) => f.key as ProvenanceKey))"
        >
          {{ t('sample.provenance.confirmSection') }}
        </button>
      </template>

      <div
        class="grid gap-x-4 gap-y-3"
        :class="section.columns === 3 ? 'grid-cols-3' : 'grid-cols-2'"
      >
        <SampleField
          v-for="(field, index) in section.fields"
          :key="field.key"
          :field="field"
          :model-value="form[field.key]"
          :provenance="provenance[field.key as ProvenanceKey]"
          :warning="warningFor(field.key)"
          :flagged="!!findingFor(field.key)"
          :beside-control="besideControl(section, index)"
          @update:model-value="(value: unknown) => setField(field.key, value)"
          @confirm="confirmField(field.key as ProvenanceKey)"
        />
      </div>
    </Panel>

    <Panel caption="NOTITIE">
      <Field
        :model-value="form.note"
        kind="textarea"
        aria-label="Notitie bij dit adres"
        :rows="4"
        placeholder="Optionele notitie bij dit adres…"
        @update:model-value="(value: unknown) => onNoteInput(value as string | null)"
      />
      <p v-if="notePending" class="text-sm mt-1.5 flex flex-wrap items-center gap-x-1.5 text-muted">
        <span aria-hidden="true" class="h-1.5 w-1.5 shrink-0 rounded-full bg-amber" />
        <span>
          {{
            noteInheritedFrom
              ? t('sample.provenance.inherited', { address: noteInheritedFrom })
              : t('sample.provenance.unverified')
          }}
        </span>
        <button
          type="button"
          class="font-semibold text-green-ink underline underline-offset-2"
          @click="confirmField('note')"
        >
          {{ t('sample.provenance.confirm') }}
        </button>
      </p>
      <p v-else-if="noteProvenance" class="text-sm mt-1.5 text-label">
        {{ t('sample.provenance.confirmed') }}
      </p>
    </Panel>
  </div>
</template>
