<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import cloneDeep from 'lodash-es/cloneDeep'

import Card from '@/components/Common/Card.vue'
import Textarea from '@/components/Common/Inputs/Textarea.vue'
import Button from '@/components/Common/Buttons/Button.vue'
import SampleField from '@/components/Inquiry/SampleField.vue'

import type {
  IInquirySample,
  IInquirySampleInput,
} from '@/services/fundermaps/interfaces/IInquirySample'
import { formatAddress } from '@/utils/address'
import { useAddressStore } from '@/stores/address'
import { useSessionStore } from '@/stores/session'
import { SAMPLE_SECTIONS } from '@/services/sampleFields'
import {
  confirm as confirmEntry,
  isConfirmed,
  summarise,
  type ProvenanceKey,
  type SampleProvenance,
} from '@/services/sampleProvenance'

const props = defineProps<{
  sample: IInquirySample
  saving?: boolean
}>()

/**
 * Which fields were carried over from another address rather than entered
 * here. Owned by the parent so it outlives switching between samples; phase 2
 * persists it on the sample itself.
 */
const provenance = defineModel<SampleProvenance>('provenance', { default: () => ({}) })

const addressStore = useAddressStore()
const sessionStore = useSessionStore()
const { t } = useI18n()

const emit = defineEmits<{
  save: [data: IInquirySampleInput]
  delete: []
}>()

/** Editable copy. Reset whenever the parent passes a new sample. */
const form = ref<IInquirySample>(cloneDeep(props.sample))

/**
 * The last state that is known to be on the server, so "has this been edited"
 * is answered by comparison rather than by a flag someone has to remember to
 * set. Re-baselined on save and on switching samples.
 */
const baseline = ref<string>(JSON.stringify(props.sample))

const isDirty = computed(() => JSON.stringify(form.value) !== baseline.value)

// Surfaced so the parent can refuse to switch away from unsaved work.
defineExpose({ isDirty })

watch(
  () => props.sample.id,
  () => {
    form.value = cloneDeep(props.sample)
    baseline.value = JSON.stringify(props.sample)
  },
)

// A save round-trips through the parent, which hands back the stored sample;
// that is the moment the edits stop being unsaved.
watch(
  () => props.sample,
  (sample) => {
    if (sample.id === form.value.id) baseline.value = JSON.stringify(sample)
  },
  { deep: true },
)

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

/**
 * Single write path for every registry-driven field. The per-field value union
 * on IInquirySample can't be expressed generically, so the cast is collapsed
 * here — one documented place instead of one per field. Editing a field also
 * ends its inherited status: the user has just made the value their own.
 */
function setField(key: keyof IInquirySample, value: unknown) {
  ;(form.value as unknown as Record<string, unknown>)[key] = value
  clearProvenance(key as ProvenanceKey)
}

function onNoteInput(value: string | null | undefined) {
  form.value.note = value ?? null
  clearProvenance('note')
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

function onSave() {
  const { id, inquiry, building, createDate, updateDate, deleteDate, ...input } = form.value
  void id
  void inquiry
  void building
  void createDate
  void updateDate
  void deleteDate
  emit('save', input as IInquirySampleInput)
}
</script>

<template>
  <Card class="List">
    <header
      class="border-grey-200 -mx-5 -mt-5 flex flex-wrap items-center justify-between gap-4 border-b px-5 py-4"
    >
      <div class="min-w-0 flex-1">
        <h3 class="heading-3 wrap-break-word">
          {{ formatAddress(addressStore.cache[form.address]) }}
        </h3>
        <p v-if="form.building" class="text-grey-700 text-xs">Pand: {{ form.building }}</p>
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <!-- Unsaved work should be visible before it is at risk, not only when
             you try to leave. -->
        <span
          v-if="isDirty"
          class="text-grey-700 flex items-center gap-1.5 text-xs"
          :title="t('sample.unsavedHint')"
        >
          <span class="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-500" />
          {{ t('sample.unsaved') }}
        </span>
        <Button label="Verwijderen" danger @click="emit('delete')" />
        <Button label="Opslaan" type="submit" :disabled="saving || !isDirty" @click="onSave" />
      </div>
    </header>

    <div class="space-y-8">
      <!-- Sections, fields, labels, options and input constraints all come
           from SAMPLE_SECTIONS — the same descriptors the reviewer overview
           and the read-only view render from. -->
      <section v-for="section in SAMPLE_SECTIONS" :key="section.title">
        <h4
          class="text-grey-700 mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm font-semibold tracking-wide uppercase"
        >
          <span>{{ section.title }}</span>
          <span
            v-if="sectionSummary[section.title].unconfirmed"
            class="flex items-center gap-2 text-xs font-normal normal-case"
          >
            {{
              t('sample.provenance.sectionPending', {
                count: sectionSummary[section.title].unconfirmed,
              })
            }}
            <button
              type="button"
              class="font-medium text-green-700 underline underline-offset-2"
              @click="confirmSection(section.fields.map((f) => f.key as ProvenanceKey))"
            >
              {{ t('sample.provenance.confirmSection') }}
            </button>
          </span>
        </h4>
        <div
          class="grid grid-cols-1 gap-4"
          :class="section.columns === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'"
        >
          <SampleField
            v-for="field in section.fields"
            :key="field.key"
            :field="field"
            :model-value="form[field.key]"
            :provenance="provenance[field.key as ProvenanceKey]"
            @update:model-value="(value: unknown) => setField(field.key, value)"
            @confirm="confirmField(field.key as ProvenanceKey)"
          />
        </div>
      </section>

      <section>
        <h4 class="text-grey-700 mb-4 text-sm font-semibold tracking-wide uppercase">Notitie</h4>
        <Textarea
          :model-value="form.note"
          placeholder="Optionele notitie…"
          :rows="4"
          @update:model-value="(value: string | null | undefined) => onNoteInput(value)"
        />
        <p
          v-if="notePending"
          class="text-grey-700 mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs"
        >
          <span class="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-500" />
          <span>{{
            noteInheritedFrom
              ? t('sample.provenance.inherited', { address: noteInheritedFrom })
              : t('sample.provenance.unverified')
          }}</span>
          <button
            type="button"
            class="font-medium text-green-700 underline underline-offset-2"
            @click="confirmField('note')"
          >
            {{ t('sample.provenance.confirm') }}
          </button>
        </p>
        <p v-else-if="noteProvenance" class="text-grey-400 mt-1 text-xs">
          {{ t('sample.provenance.confirmed') }}
        </p>
      </section>
    </div>
  </Card>
</template>
