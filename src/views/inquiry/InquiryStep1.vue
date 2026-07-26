<script setup lang="ts">
import { computed, onBeforeMount, ref, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppShell from '@/components/Layout/AppShell.vue'
import WizardHeader from '@/components/Layout/WizardHeader.vue'
import Button from '@/components/Common/Buttons/Button.vue'
import Callout from '@/components/Common/Callout.vue'
import Dropzone, { type AttachedFile } from '@/components/Common/Dropzone.vue'
import Field from '@/components/Common/Field.vue'
import Panel from '@/components/Common/Panel.vue'
import PresetList, { type Preset } from '@/components/Common/PresetList.vue'
import ToggleChip from '@/components/Common/ToggleChip.vue'

import api from '@/services/fundermaps'
import type { IContractor } from '@/services/fundermaps/interfaces/IContractor'
import type { IUser } from '@/services/fundermaps/interfaces/IUser'
import { describeFailure } from '@/services/fundermaps/errors'
import { INQUIRY_TYPE_LABELS } from '@/services/inquiryEnums'
import type { SelectOption } from '@/services/options'
import { toastError, toastSuccess } from '@/services/toast'
import { formatTime } from '@/utils/date'
import { useActionShortcuts } from '@/services/useActionShortcuts'
import { inquirySteps } from '@/services/wizard'

/**
 * Step 1 — the report's own facts, and the document it came from.
 *
 * Two columns rather than one long form: the six fields that describe the
 * report belong together on the left, and the things that *produce* those
 * fields — the PDF you are reading them off, and the preset that fills half of
 * them in — belong on the right, where you can reach them without losing your
 * place.
 *
 * `Volgende` stays disabled until the four required fields are valid, and the
 * reason is written under whichever field is missing. A disabled button with no
 * explanation is the single most common way a form wastes someone's afternoon.
 */
const route = useRoute()
const router = useRouter()

const inquiryId = computed(() => {
  const id = route.params.id
  return id ? Number(id) : null
})
const isNew = computed(() => inquiryId.value === null)

const loading = ref(true)
const saving = ref(false)
const uploading = ref(false)
const uploadError: Ref<string | null> = ref(null)
/** Set once a save has come back, so the header can stop saying "niet opgeslagen". */
const savedAt = ref<string | null>(null)
/** Only show per-field reasons once the user has tried to move on. */
const showErrors = ref(false)

const contractors: Ref<IContractor[]> = ref([])
const reviewers: Ref<IUser[]> = ref([])

// #999: read-only display of the owning organization (attribution.dataOwnerName,
// introduced by #973). Kept out of the submit body — the data-owner is assigned
// server-side, not edited here.
const dataOwnerName = ref('')

const form = ref({
  documentName: '',
  type: null as number | null,
  documentDate: '',
  documentFile: '',
  contractor: null as number | null,
  reviewer: null as string | null,
  standardF3o: false,
  inspection: false,
  jointMeasurement: false,
  floorMeasurement: false,
  note: '',
})

/** What the dropzone shows. Name and size are client-side; the API returns only a storage name. */
const attached = ref<AttachedFile | null>(null)

const typeOptions: SelectOption[] = Object.entries(INQUIRY_TYPE_LABELS).map(([value, label]) => ({
  value: Number(value),
  label,
}))

const contractorOptions = computed<SelectOption[]>(() =>
  contractors.value.map((c) => ({ value: c.id, label: c.name })),
)

const reviewerOptions = computed<SelectOption[]>(() =>
  reviewers.value.map((r) => ({
    value: r.id,
    label: [r.given_name, r.family_name].filter(Boolean).join(' ').trim() || r.email,
  })),
)

/* -------------------------------------------------------------- validation */

/**
 * One reason per field, in words. Written here rather than derived from a
 * schema message so each one can say what to do ("Kies een uitvoerder") rather
 * than what is wrong ("Required").
 */
const errors = computed<Record<string, string | null>>(() => ({
  documentName: !form.value.documentName.trim()
    ? 'Geef het rapport een naam.'
    : form.value.documentName.length > 64
      ? 'Maximaal 64 tekens.'
      : null,
  type: form.value.type === null ? 'Kies een type.' : null,
  documentDate: !form.value.documentDate ? 'Vul de documentdatum in.' : null,
  contractor: form.value.contractor === null ? 'Kies een uitvoerder.' : null,
  reviewer: !form.value.reviewer ? 'Kies een beoordelaar.' : null,
  documentFile: !form.value.documentFile ? 'Upload eerst het brondocument.' : null,
}))

const isValid = computed(() => Object.values(errors.value).every((error) => error === null))

/** Only surfaced after a failed attempt — see `showErrors`. */
function errorFor(field: string): string | null {
  return showErrors.value ? errors.value[field] ?? null : null
}

/* ------------------------------------------------------------------ upload */

/** `rapport-elkien.pdf` → `rapport-elkien`, as a starting point for the name. */
function nameFromFile(filename: string): string {
  const dot = filename.lastIndexOf('.')
  return (dot > 0 ? filename.slice(0, dot) : filename).slice(0, 64)
}

async function onPick(file: File) {
  uploadError.value = null
  uploading.value = true
  attached.value = { name: file.name, sizeBytes: file.size, uploaded: false }
  try {
    const { name } = await api.inquiry.uploadDocument(file)
    form.value.documentFile = name
    attached.value = { name: file.name, sizeBytes: file.size, uploaded: true }
    // A suggestion, never an override: the filename is a decent first guess at
    // the report's name and a terrible replacement for one you already typed.
    if (!form.value.documentName.trim()) form.value.documentName = nameFromFile(file.name)
  } catch (err) {
    uploadError.value = describeFailure(err, 'Uploaden van het document is niet gelukt.')
    attached.value = null
  } finally {
    uploading.value = false
  }
}

function onRemove() {
  attached.value = null
  form.value.documentFile = ''
}

/* ----------------------------------------------------------------- presets */

const PRESETS: Preset[] = [
  {
    key: 'quickscan',
    label: 'QuickScan (addendum)',
    meta: 'type + F3O voorgevuld',
    tone: 'blue',
    hotkey: '1',
  },
  { key: 'archief', label: 'Archief onderzoek', meta: 'geen meting', tone: 'amber', hotkey: '2' },
  {
    key: 'notitie',
    label: 'Terugmelding / notitie',
    meta: 'alleen naam en adres',
    tone: 'green',
    hotkey: '3',
  },
]

/** What each preset actually sets. Flags are set *and* cleared, so picking a
    second preset does not leave the first one's switches on. */
const PRESET_VALUES: Record<string, { type: number; standardF3o: boolean }> = {
  quickscan: { type: 14, standardF3o: true },
  archief: { type: 7, standardF3o: false },
  notitie: { type: 2, standardF3o: false },
}

function applyPreset(preset: Preset) {
  const values = PRESET_VALUES[preset.key]
  if (!values) return
  form.value.type = values.type
  form.value.standardF3o = values.standardF3o
  form.value.inspection = false
  form.value.jointMeasurement = false
  form.value.floorMeasurement = false
}

/* -------------------------------------------------------------------- save */

function body() {
  return {
    documentName: form.value.documentName.trim(),
    type: form.value.type!,
    documentDate: form.value.documentDate,
    documentFile: form.value.documentFile,
    standardF3o: form.value.standardF3o,
    inspection: form.value.inspection,
    jointMeasurement: form.value.jointMeasurement,
    floorMeasurement: form.value.floorMeasurement,
    note: form.value.note,
    attribution: {
      reviewer: form.value.reviewer!,
      contractor: form.value.contractor!,
    },
  }
}

/**
 * Persist and return the dossier's id. Creating on the first save is what makes
 * the rest of the wizard work: step 2 attaches addresses to a real record, so
 * nothing typed here is held hostage until the very end.
 */
async function persist(): Promise<number | null> {
  showErrors.value = true
  if (!isValid.value || saving.value) return null

  saving.value = true
  try {
    if (isNew.value) {
      const created = await api.inquiry.create(body())
      savedAt.value = new Date().toISOString()
      // Swap the URL over to the edit route so a refresh — or a second save —
      // updates the draft instead of creating a duplicate.
      await router.replace({ name: 'inquiry-edit-1', params: { id: created.id } })
      return created.id
    }
    await api.inquiry.update(inquiryId.value!, body())
    savedAt.value = new Date().toISOString()
    return inquiryId.value
  } catch (err) {
    toastError(describeFailure(err, 'Opslaan is niet gelukt.'))
    return null
  } finally {
    saving.value = false
  }
}

async function saveDraft() {
  const id = await persist()
  if (id !== null) toastSuccess('Concept opgeslagen.')
}

async function next() {
  const id = await persist()
  if (id !== null) router.push({ name: 'inquiry-edit-2', params: { id } })
}

const draftStatus = computed(() => {
  if (saving.value) return 'bezig met opslaan…'
  if (savedAt.value) return `concept · opgeslagen ${formatTime(savedAt.value)}`
  if (!isNew.value) return `#${inquiryId.value} · wijzigingen nog niet opgeslagen`
  return 'concept · nog niet opgeslagen'
})

const steps = computed(() => inquirySteps(inquiryId.value))

useActionShortcuts(() => ({
  '⌘S': saveDraft,
  '⌘↵': next,
  ...Object.fromEntries(PRESETS.map((preset) => [preset.hotkey, () => applyPreset(preset)])),
}))

onBeforeMount(async () => {
  try {
    const [c, r] = await Promise.all([api.contractor.list(), api.reviewer.list()])
    contractors.value = c
    reviewers.value = r

    if (!isNew.value) {
      const inquiry = await api.inquiry.getById(inquiryId.value!)
      form.value = {
        documentName: inquiry.documentName,
        type: inquiry.type,
        documentDate: inquiry.documentDate?.slice(0, 10) ?? '',
        documentFile: inquiry.documentFile,
        contractor: inquiry.attribution.contractor,
        reviewer: inquiry.attribution.reviewer,
        standardF3o: inquiry.standardF3o,
        inspection: inquiry.inspection,
        jointMeasurement: inquiry.jointMeasurement,
        floorMeasurement: inquiry.floorMeasurement,
        note: inquiry.note ?? '',
      }
      dataOwnerName.value = inquiry.attribution.dataOwnerName ?? ''
      if (inquiry.documentFile) {
        // The stored name is a GUID; the original filename lives in
        // file_resources and only 22% of dossiers have one. Say "gekoppeld"
        // rather than showing a GUID as if it were a filename.
        attached.value = { name: 'Gekoppeld document', sizeBytes: null, uploaded: true }
      }
    }
  } catch (err) {
    toastError(describeFailure(err, 'De gegevens konden niet worden opgehaald.'))
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <AppShell :crumb="isNew ? 'Nieuwe rapportage' : 'Rapportage bewerken'">
    <WizardHeader
      :title="isNew ? 'Nieuwe rapportage' : 'Rapportage bewerken'"
      :status="draftStatus"
      :steps="steps"
      :current="1"
      connected
    >
      <template #actions>
        <Button label="Annuleren" @click="router.push({ name: 'inquiry-list' })" />
        <Button
          label="Concept opslaan"
          shortcut="⌘S"
          :disabled="saving || uploading"
          @click="saveDraft"
        />
        <Button
          variant="primary"
          label="Volgende: adressen"
          shortcut="⌘↵"
          :disabled="!isValid || saving || uploading"
          @click="next"
        />
      </template>
    </WizardHeader>

    <div class="grid grid-cols-[minmax(0,1fr)_var(--spacing-drawer)] items-start gap-4.5 px-6 py-5">
      <div class="flex min-w-0 flex-col gap-4">
        <p class="text-lg text-muted">
          Basisgegevens en document — adressen volgen in stap 2. Je kunt tussentijds opslaan als
          concept; het dossier blijft van jou tot je het aanbiedt.
        </p>

        <Panel caption="RAPPORT" meta="4 verplichte velden">
          <div class="grid grid-cols-2 gap-x-4 gap-y-3">
            <Field
              v-model="form.documentName"
              label="Naam"
              required
              placeholder="bijv. QS-FOS-553560"
              hint="wordt voorgesteld op basis van de bestandsnaam"
              :error="errorFor('documentName')"
            />
            <Field
              v-model="form.type"
              label="Type"
              kind="select"
              required
              :options="typeOptions"
              empty-label="Kies een type"
              hint="QuickScan, Archief onderzoek, Notitie…"
              :error="errorFor('type')"
            />
            <Field
              v-model="form.documentDate"
              label="Documentdatum"
              kind="date"
              required
              :error="errorFor('documentDate')"
            />
            <Field
              v-model="form.contractor"
              label="Uitvoerder"
              kind="select"
              required
              :options="contractorOptions"
              empty-label="Kies een uitvoerder"
              :error="errorFor('contractor')"
            />
            <Field
              v-model="dataOwnerName"
              label="Data-eigenaar"
              placeholder="wordt bij opslaan bepaald"
              disabled
              hint="standaard je eigen organisatie"
            />
            <Field
              v-model="form.reviewer"
              label="Beoordelaar"
              kind="select"
              required
              :options="reviewerOptions"
              empty-label="Kies een beoordelaar"
              hint="krijgt het dossier na aanbieden"
              :error="errorFor('reviewer')"
            />
          </div>
        </Panel>

        <Panel caption="EIGENSCHAPPEN">
          <template #header>
            <span class="studio-caption">EIGENSCHAPPEN</span>
            <span class="text-xs font-mono text-label">
              {{
                [
                  form.standardF3o,
                  form.inspection,
                  form.jointMeasurement,
                  form.floorMeasurement,
                ].filter(Boolean).length
              }}
              van 4 aan
            </span>
          </template>

          <div class="flex flex-col gap-3.5">
            <!-- Chips rather than a checkbox matrix: these four are properties a
                 report *has*, and most reports switch on one and leave the rest
                 alone. A stack of checkboxes reads as a form to work through. -->
            <div class="flex flex-wrap gap-2">
              <ToggleChip v-model="form.standardF3o" label="F3O standaard" />
              <ToggleChip v-model="form.jointMeasurement" label="Voegmeting" />
              <ToggleChip v-model="form.inspection" label="Inspectie" />
              <ToggleChip v-model="form.floorMeasurement" label="Vloermeting" />
            </div>

            <Field
              v-model="form.note"
              label="Notitie"
              kind="textarea"
              :rows="4"
              placeholder="Optionele notitie voor de beoordelaar…"
            />
          </div>
        </Panel>
      </div>

      <aside class="flex flex-col gap-4">
        <Panel caption="BRONDOCUMENT">
          <Dropzone
            :file="attached"
            :uploading="uploading"
            :error="uploadError ?? errorFor('documentFile')"
            @pick="onPick"
            @remove="onRemove"
            @reject="uploadError = $event"
          />
        </Panel>

        <Panel caption="SNEL BEGINNEN">
          <PresetList :presets="PRESETS" @pick="applyPreset" />
        </Panel>

        <Callout tone="green" title="Hierna: adressen" plain>
          Zoek panden op adres of pand-ID; per adres vul je de bevindingen in. Het concept blijft van
          jou tot je het aanbiedt ter controle.
        </Callout>
      </aside>
    </div>
  </AppShell>
</template>
