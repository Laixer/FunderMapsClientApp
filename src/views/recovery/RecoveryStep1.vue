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
import Textarea from '@/components/Common/Inputs/Textarea.vue'
import Spinner from '@/components/Common/Spinner.vue'

import api from '@/services/fundermaps'
import type { IContractor } from '@/services/fundermaps/interfaces/IContractor'
import type { IUser } from '@/services/fundermaps/interfaces/IUser'
import { RECOVERY_DOCUMENT_TYPE_LABELS } from '@/services/recoveryEnums'
import useValidation from '@/services/useValidation'
import { getErrorMessage } from '@/services/fundermaps/errors'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const recoveryId = computed(() => {
  const id = route.params.id
  return id ? Number(id) : null
})
const isNew = computed(() => recoveryId.value === null)

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
    note: z.string(),
  })
  .strict()

const { validate, isValid, getStatus, getError } = useValidation(schema, formData)

const typeOptions = computed(() =>
  Object.entries(RECOVERY_DOCUMENT_TYPE_LABELS).map(([k, label]) => ({
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
    const { name } = await api.recovery.uploadDocument(file)
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
      note: formData.value.note,
      attribution: {
        reviewer: formData.value.reviewer,
        contractor: formData.value.contractor!,
      },
    }
    if (isNew.value) {
      const created = await api.recovery.create(body)
      router.push({ name: 'recovery-edit-2', params: { id: created.id } })
    } else {
      await api.recovery.update(recoveryId.value!, body)
      router.push({ name: 'recovery-edit-2', params: { id: recoveryId.value! } })
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
      const recovery = await api.recovery.getById(recoveryId.value!)
      formData.value = {
        documentName: recovery.documentName,
        type: recovery.type,
        documentDate: recovery.documentDate?.slice(0, 10) ?? '',
        documentFile: recovery.documentFile,
        contractor: recovery.attribution.contractor,
        reviewer: recovery.attribution.reviewer,
        note: recovery.note ?? '',
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
          {{ isNew ? 'Nieuw herstel' : 'Herstel bewerken' }} — gegevens (stap 1 van 3)
        </h2>
      </header>
      <Spinner v-if="loading" />
      <span v-if="false">{{ t('common.loading') }}</span>
      <Alert v-if="saveError" :closeable="true" @close="saveError = null">{{ saveError }}</Alert>
    </Card>

    <Card v-if="!loading" class="List col-span-3">
      <form class="space-y-8" @submit.prevent="onSubmit">
        <section>
          <h4 class="mb-4 text-sm font-semibold uppercase tracking-wide text-grey-700">
            Document
          </h4>
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
              label="Documenttype"
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
        </section>

        <section>
          <h4 class="mb-4 text-sm font-semibold uppercase tracking-wide text-grey-700">
            Bestand
          </h4>
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
        </section>

        <section>
          <h4 class="mb-4 text-sm font-semibold uppercase tracking-wide text-grey-700">
            Notitie
          </h4>
          <Textarea v-model="formData.note" placeholder="Optionele notitie…" :rows="4" />
        </section>

        <div class="-mx-5 -mb-5 flex justify-end gap-3 border-t border-grey-200 px-5 py-4">
          <Button
            label="Opslaan en verder"
            type="submit"
            :disabled="saving || uploading"
          />
        </div>
      </form>
    </Card>
  </MainWrapper>
</template>
