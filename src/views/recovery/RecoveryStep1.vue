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

import api from '@/services/fundermaps'
import type { IContractor } from '@/services/fundermaps/interfaces/IContractor'
import type { IUser } from '@/services/fundermaps/interfaces/IUser'
import { describeFailure } from '@/services/fundermaps/errors'
import type { SelectOption } from '@/services/options'
import { RECOVERY_DOCUMENT_TYPE_OPTIONS } from '@/services/recoveryEnums'
import { toastError, toastSuccess } from '@/services/toast'
import { formatTime } from '@/utils/date'
import { useActionShortcuts } from '@/services/useActionShortcuts'
import { recoverySteps } from '@/services/wizard'

/**
 * Step 1 of the herstel wizard — the same shape as the inquiry's, with the
 * fields a repair dossier actually has.
 *
 * There is no preset list here: a repair document is a permit, a report or an
 * owner's evidence, and which one it is comes straight off the document rather
 * than from a working style worth a shortcut.
 */
const route = useRoute()
const router = useRouter()

const recoveryId = computed(() => {
  const id = route.params.id
  return id ? Number(id) : null
})
const isNew = computed(() => recoveryId.value === null)

const loading = ref(true)
const saving = ref(false)
const uploading = ref(false)
const uploadError: Ref<string | null> = ref(null)
const savedAt = ref<string | null>(null)
const showErrors = ref(false)

const contractors: Ref<IContractor[]> = ref([])
const reviewers: Ref<IUser[]> = ref([])
const dataOwnerName = ref('')

const form = ref({
  documentName: '',
  type: null as number | null,
  documentDate: '',
  documentFile: '',
  contractor: null as number | null,
  reviewer: null as string | null,
  note: '',
})

const attached = ref<AttachedFile | null>(null)

const contractorOptions = computed<SelectOption[]>(() =>
  contractors.value.map((c) => ({ value: c.id, label: c.name })),
)

const reviewerOptions = computed<SelectOption[]>(() =>
  reviewers.value.map((r) => ({
    value: r.id,
    label: [r.given_name, r.family_name].filter(Boolean).join(' ').trim() || r.email,
  })),
)

const errors = computed<Record<string, string | null>>(() => ({
  documentName: !form.value.documentName.trim()
    ? 'Geef het dossier een naam.'
    : form.value.documentName.length > 64
      ? 'Maximaal 64 tekens.'
      : null,
  type: form.value.type === null ? 'Kies een documenttype.' : null,
  documentDate: !form.value.documentDate ? 'Vul de documentdatum in.' : null,
  contractor: form.value.contractor === null ? 'Kies een uitvoerder.' : null,
  reviewer: !form.value.reviewer ? 'Kies een beoordelaar.' : null,
  documentFile: !form.value.documentFile ? 'Upload eerst het brondocument.' : null,
}))

const isValid = computed(() => Object.values(errors.value).every((error) => error === null))

function errorFor(field: string): string | null {
  return showErrors.value ? errors.value[field] ?? null : null
}

function nameFromFile(filename: string): string {
  const dot = filename.lastIndexOf('.')
  return (dot > 0 ? filename.slice(0, dot) : filename).slice(0, 64)
}

async function onPick(file: File) {
  uploadError.value = null
  uploading.value = true
  attached.value = { name: file.name, sizeBytes: file.size, uploaded: false }
  try {
    const { name } = await api.recovery.uploadDocument(file)
    form.value.documentFile = name
    attached.value = { name: file.name, sizeBytes: file.size, uploaded: true }
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

function body() {
  return {
    documentName: form.value.documentName.trim(),
    type: form.value.type!,
    documentDate: form.value.documentDate,
    documentFile: form.value.documentFile,
    note: form.value.note,
    attribution: {
      reviewer: form.value.reviewer!,
      contractor: form.value.contractor!,
    },
  }
}

/** Creating on the first save is what lets step 2 attach panden to a real record. */
async function persist(): Promise<number | null> {
  showErrors.value = true
  if (!isValid.value || saving.value) return null

  saving.value = true
  try {
    if (isNew.value) {
      const created = await api.recovery.create(body())
      savedAt.value = new Date().toISOString()
      await router.replace({ name: 'recovery-edit-1', params: { id: created.id } })
      return created.id
    }
    await api.recovery.update(recoveryId.value!, body())
    savedAt.value = new Date().toISOString()
    return recoveryId.value
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
  if (id !== null) router.push({ name: 'recovery-edit-2', params: { id } })
}

const draftStatus = computed(() => {
  if (saving.value) return 'bezig met opslaan…'
  if (savedAt.value) return `concept · opgeslagen ${formatTime(savedAt.value)}`
  if (!isNew.value) return `#${recoveryId.value} · wijzigingen nog niet opgeslagen`
  return 'concept · nog niet opgeslagen'
})

const steps = computed(() => recoverySteps(recoveryId.value))

useActionShortcuts(() => ({ '⌘S': () => void saveDraft(), '⌘↵': () => void next() }))

onBeforeMount(async () => {
  try {
    const [c, r] = await Promise.all([api.contractor.list(), api.reviewer.list()])
    contractors.value = c
    reviewers.value = r

    if (!isNew.value) {
      const recovery = await api.recovery.getById(recoveryId.value!)
      form.value = {
        documentName: recovery.documentName,
        type: recovery.type,
        documentDate: recovery.documentDate?.slice(0, 10) ?? '',
        documentFile: recovery.documentFile,
        contractor: recovery.attribution.contractor,
        reviewer: recovery.attribution.reviewer,
        note: recovery.note ?? '',
      }
      dataOwnerName.value = recovery.attribution.dataOwnerName ?? ''
      if (recovery.documentFile) {
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
  <AppShell :crumb="isNew ? 'Nieuw herstel' : 'Herstel bewerken'">
    <WizardHeader
      :title="isNew ? 'Nieuw herstel' : 'Herstel bewerken'"
      :status="draftStatus"
      :steps="steps"
      :current="1"
      connected
    >
      <template #actions>
        <Button label="Annuleren" @click="router.push({ name: 'recovery-list' })" />
        <Button
          label="Concept opslaan"
          shortcut="⌘S"
          :disabled="saving || uploading"
          @click="saveDraft"
        />
        <Button
          variant="primary"
          label="Volgende: panden"
          shortcut="⌘↵"
          :disabled="!isValid || saving || uploading"
          @click="next"
        />
      </template>
    </WizardHeader>

    <div class="grid grid-cols-[minmax(0,1fr)_var(--spacing-drawer)] items-start gap-4.5 px-6 py-5">
      <div class="flex min-w-0 flex-col gap-4">
        <p class="text-lg text-muted">
          Basisgegevens en document — de panden volgen in stap 2. Je kunt tussentijds opslaan als
          concept.
        </p>

        <Panel caption="DOCUMENT" meta="4 verplichte velden">
          <div class="grid grid-cols-2 gap-x-4 gap-y-3">
            <Field
              v-model="form.documentName"
              label="Naam"
              required
              placeholder="bijv. Vergunning Baan 60W"
              hint="wordt voorgesteld op basis van de bestandsnaam"
              :error="errorFor('documentName')"
            />
            <Field
              v-model="form.type"
              label="Documenttype"
              kind="select"
              required
              :options="RECOVERY_DOCUMENT_TYPE_OPTIONS"
              empty-label="Kies een type"
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

        <Panel caption="NOTITIE">
          <Field
            v-model="form.note"
            kind="textarea"
            :rows="4"
            placeholder="Optionele notitie voor de beoordelaar…"
          />
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

        <Callout tone="green" title="Hierna: panden" plain>
          Zoek de panden waar het herstel is uitgevoerd; per pand leg je het hersteltype, de gevels
          en de vergunning vast.
        </Callout>
      </aside>
    </div>
  </AppShell>
</template>
