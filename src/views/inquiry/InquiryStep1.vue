<script setup lang="ts">
import { computed, onBeforeMount, ref, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { z } from 'zod'

import MainWrapper from '@/components/Layout/MainWrapper.vue'
import Card from '@/components/Common/Card.vue'
import Button from '@/components/Common/Buttons/Button.vue'
import Alert from '@/components/Common/Alert.vue'
import Input from '@/components/Common/Inputs/Input.vue'
import Select from '@/components/Common/Inputs/Select.vue'
import CheckBox from '@/components/Common/Inputs/CheckBox.vue'
import Textarea from '@/components/Common/Inputs/Textarea.vue'
import Spinner from '@/components/Common/Spinner.vue'

import api from '@/services/fundermaps'
import type { IContractor } from '@/services/fundermaps/interfaces/IContractor'
import type { IUser } from '@/services/fundermaps/interfaces/IUser'
import { INQUIRY_TYPE_LABELS } from '@/services/inquiryEnums'
import useValidation from '@/services/useValidation'
import { getErrorMessage } from '@/services/fundermaps/errors'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const inquiryId = computed(() => {
  const id = route.params.id
  return id ? Number(id) : null
})
const isNew = computed(() => inquiryId.value === null)

const loading = ref(true)
const saving = ref(false)
const saveError: Ref<string | null> = ref(null)
const uploadError: Ref<string | null> = ref(null)
const uploading = ref(false)

const contractors: Ref<IContractor[]> = ref([])
const reviewers: Ref<IUser[]> = ref([])

const formData = ref({
  documentName: '',
  type: null as number | null,
  documentDate: '',
  documentFile: '',
  contractor: null as number | null,
  reviewer: '',
  standardF3o: false,
  inspection: false,
  jointMeasurement: false,
  floorMeasurement: false,
  note: '',
})

const schema = z
  .object({
    documentName: z.string().min(1, 'Naam is verplicht.').max(64, 'Maximaal 64 tekens.'),
    type: z.number().int('Kies een type.'),
    documentDate: z.string().min(1, 'Datum is verplicht.'),
    documentFile: z.string().min(1, 'Upload eerst een document.'),
    contractor: z.number().int('Kies een uitvoerder.'),
    reviewer: z.string().uuid('Kies een beoordelaar.'),
    standardF3o: z.boolean(),
    inspection: z.boolean(),
    jointMeasurement: z.boolean(),
    floorMeasurement: z.boolean(),
    note: z.string(),
  })
  .strict()

const { validate, isValid, getStatus, getError } = useValidation(schema, formData)

const typeOptions = computed(() =>
  Object.entries(INQUIRY_TYPE_LABELS).map(([k, label]) => ({
    value: Number(k),
    label,
  })),
)
const contractorOptions = computed(() =>
  contractors.value.map((c) => ({ value: c.id, label: c.name })),
)
const reviewerOptions = computed(() =>
  reviewers.value.map((r) => ({
    value: r.id,
    label:
      [r.given_name, r.family_name].filter(Boolean).join(' ').trim() || r.email,
  })),
)

async function onUpload(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploadError.value = null
  uploading.value = true
  try {
    const { name } = await api.inquiry.uploadDocument(file)
    formData.value.documentFile = name
  } catch (err) {
    uploadError.value = getErrorMessage(err) ?? 'Upload mislukt.'
  } finally {
    uploading.value = false
  }
}

async function onSubmit() {
  if (saving.value) return
  saveError.value = null
  await validate()
  if (!isValid.value) return

  saving.value = true
  try {
    const body = {
      documentName: formData.value.documentName,
      type: formData.value.type!,
      documentDate: formData.value.documentDate,
      documentFile: formData.value.documentFile,
      standardF3o: formData.value.standardF3o,
      inspection: formData.value.inspection,
      jointMeasurement: formData.value.jointMeasurement,
      floorMeasurement: formData.value.floorMeasurement,
      note: formData.value.note,
      attribution: {
        reviewer: formData.value.reviewer,
        contractor: formData.value.contractor!,
      },
    }
    if (isNew.value) {
      const created = await api.inquiry.create(body)
      router.push({ name: 'inquiry-edit-2', params: { id: created.id } })
    } else {
      await api.inquiry.update(inquiryId.value!, body)
      router.push({ name: 'inquiry-edit-2', params: { id: inquiryId.value! } })
    }
  } catch (err) {
    saveError.value = getErrorMessage(err) ?? t('error.generic')
  } finally {
    saving.value = false
  }
}

onBeforeMount(async () => {
  try {
    const [c, r] = await Promise.all([
      api.contractor.list(),
      api.reviewer.list(),
    ])
    contractors.value = c
    reviewers.value = r

    if (!isNew.value) {
      const inquiry = await api.inquiry.getById(inquiryId.value!)
      formData.value = {
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
    }
  } catch (err) {
    saveError.value = getErrorMessage(err) ?? t('error.generic')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <MainWrapper>
    <Card class="List col-span-3 mt-16">
      <header
        class="-mx-5 -mt-5 flex items-center justify-between gap-4 border-b border-grey-200 px-5 py-4"
      >
        <h2 class="heading-3">
          {{ isNew ? 'Nieuwe rapportage' : 'Rapportage bewerken' }} — gegevens (stap 1 van 3)
        </h2>
      </header>
      <Spinner v-if="loading" />
      <span v-if="false">{{ t('common.loading') }}</span>
      <Alert v-if="saveError" :closeable="true" @close="saveError = null">{{ saveError }}</Alert>
    </Card>

    <template v-if="!loading">
      <Card class="col-span-3" title="Rapport">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            v-model="formData.documentName"
            label="Naam"
            required
            :validationStatus="getStatus('documentName')"
            :validationMessage="getError('documentName')"
          />

          <Select
            v-model="formData.type"
            label="Type"
            :options="typeOptions"
            placeholder="Kies een type"
            required
            :validationStatus="getStatus('type')"
            :validationMessage="getError('type')"
          />

          <Input
            v-model="formData.documentDate"
            label="Datum"
            type="date"
            required
            :validationStatus="getStatus('documentDate')"
            :validationMessage="getError('documentDate')"
          />

          <Select
            v-model="formData.contractor"
            label="Uitvoerder"
            :options="contractorOptions"
            placeholder="Kies een uitvoerder"
            required
            :validationStatus="getStatus('contractor')"
            :validationMessage="getError('contractor')"
          />

          <Select
            v-model="formData.reviewer"
            label="Beoordelaar"
            :options="reviewerOptions"
            placeholder="Kies een beoordelaar"
            required
            :validationStatus="getStatus('reviewer')"
            :validationMessage="getError('reviewer')"
          />
        </div>
      </Card>

      <Card class="col-span-3" title="Document">
        <div class="space-y-2">
          <input
            type="file"
            accept="application/pdf,image/*"
            :disabled="uploading"
            class="block w-full text-sm text-grey-800"
            @change="onUpload"
          />
          <p v-if="uploading" class="text-sm text-grey-700">Bezig met uploaden…</p>
          <p v-if="formData.documentFile" class="text-sm text-green-800">
            Document gekoppeld: {{ formData.documentFile }}
          </p>
          <Alert v-if="uploadError" :closeable="true" @close="uploadError = null">
            {{ uploadError }}
          </Alert>
          <p v-if="getStatus('documentFile') === 'error'" class="text-sm text-red-500">
            {{ getError('documentFile') }}
          </p>
        </div>
      </Card>

      <Card class="col-span-3" title="Eigenschappen">
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <CheckBox v-model="formData.standardF3o" label="F3O standaard" />
          <CheckBox v-model="formData.inspection" label="Inspectie" />
          <CheckBox v-model="formData.jointMeasurement" label="Voegmeting" />
          <CheckBox v-model="formData.floorMeasurement" label="Vloermeting" />
        </div>
      </Card>

      <Card class="col-span-3" title="Notitie">
        <Textarea v-model="formData.note" placeholder="Optionele notitie…" :rows="4" />
      </Card>

      <Card class="col-span-3">
        <div class="flex justify-end gap-3">
          <Button
            label="Opslaan en verder"
            type="submit"
            :disabled="saving || uploading"
            @click="onSubmit"
          />
        </div>
      </Card>
    </template>
  </MainWrapper>
</template>
