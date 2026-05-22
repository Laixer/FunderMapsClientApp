<script setup lang="ts">
import { computed, onBeforeMount, ref, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import MainWrapper from '@/components/Layout/MainWrapper.vue'
import Card from '@/components/Common/Card.vue'
import Button from '@/components/Common/Buttons/Button.vue'
import Alert from '@/components/Common/Alert.vue'
import StatusBadge from '@/components/Common/StatusBadge.vue'
import Spinner from '@/components/Common/Spinner.vue'

import api from '@/services/fundermaps'
import type { IRecovery } from '@/services/fundermaps/interfaces/IRecovery'
import type { IRecoverySample } from '@/services/fundermaps/interfaces/IRecoverySample'
import { recoveryDocumentTypeLabel, AUDIT_STATUS } from '@/services/recoveryEnums'
import { formatDate } from '@/utils/date'
import { formatAddress } from '@/utils/address'
import { getErrorMessage } from '@/services/fundermaps/errors'
import { useAddressStore } from '@/stores/address'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const recoveryId = computed(() => Number(route.params.id))
const addressStore = useAddressStore()

const recovery: Ref<IRecovery | null> = ref(null)
const samples: Ref<IRecoverySample[]> = ref([])
const loading = ref(true)
const submitting = ref(false)
const error: Ref<string | null> = ref(null)

const canSubmit = computed(() => {
  if (!recovery.value) return false
  const s = recovery.value.state.auditStatus
  return (
    samples.value.length > 0 &&
    (s === AUDIT_STATUS.TODO || s === AUDIT_STATUS.PENDING || s === AUDIT_STATUS.REJECTED)
  )
})

async function load() {
  try {
    loading.value = true
    error.value = null
    const [r, s] = await Promise.all([
      api.recovery.getById(recoveryId.value),
      api.recoverySample.listAll(recoveryId.value),
    ])
    recovery.value = r
    samples.value = s
    await addressStore.ensureMany(s.map((row) => row.building))
  } catch (e) {
    error.value = getErrorMessage(e) ?? t('error.generic')
  } finally {
    loading.value = false
  }
}

onBeforeMount(load)

async function submit() {
  if (!canSubmit.value || submitting.value) return
  if (!confirm('Aanbieden ter review?')) return
  submitting.value = true
  error.value = null
  try {
    await api.recovery.submitForReview(recoveryId.value)
    router.push({ name: 'recovery-view', params: { id: recoveryId.value } })
  } catch (e) {
    error.value = getErrorMessage(e) ?? t('error.generic')
  } finally {
    submitting.value = false
  }
}

function previous() {
  router.push({ name: 'recovery-edit-2', params: { id: recoveryId.value } })
}
</script>

<template>
  <MainWrapper>
    <Card class="List col-span-3 mt-16">
      <header
        class="-mx-5 -mt-5 flex items-center justify-between gap-4 border-b border-grey-200 px-5 py-4"
      >
        <div>
          <h2 class="heading-3">Herstel — controle (stap 3 van 3)</h2>
          <div v-if="recovery" class="mt-1 flex items-center gap-2 text-sm text-grey-700">
            <span>{{ recoveryDocumentTypeLabel(recovery.type) }}</span>
            <span>·</span>
            <span>{{ formatDate(recovery.documentDate) }}</span>
            <StatusBadge :status="recovery.state.auditStatus" />
          </div>
        </div>
        <div class="flex gap-2">
          <Button label="Vorige" outline @click="previous" />
          <Button
            label="Aanbieden ter review"
            :disabled="!canSubmit || submitting"
            @click="submit"
          />
        </div>
      </header>

      <Alert v-if="error" :closeable="true" @close="error = null">{{ error }}</Alert>
      <Spinner v-if="loading" />
      <span v-if="false">{{ t('common.loading') }}</span>

      <div v-if="recovery" class="space-y-8">
        <section>
          <h4 class="mb-4 text-sm font-semibold uppercase tracking-wide text-grey-700">
            Document
          </h4>
          <dl class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
            <dt class="font-medium text-grey-700">Naam</dt>
            <dd class="sm:col-span-2">{{ recovery.documentName }}</dd>

            <dt class="font-medium text-grey-700">Opsteller</dt>
            <dd class="sm:col-span-2">{{ recovery.attribution.creatorName ?? '-' }}</dd>

            <dt class="font-medium text-grey-700">Beoordelaar</dt>
            <dd class="sm:col-span-2">{{ recovery.attribution.reviewerName ?? '-' }}</dd>

            <dt class="font-medium text-grey-700">Uitvoerder</dt>
            <dd class="sm:col-span-2">{{ recovery.attribution.contractorName ?? '-' }}</dd>

            <dt v-if="recovery.note" class="font-medium text-grey-700">Notitie</dt>
            <dd v-if="recovery.note" class="whitespace-pre-wrap sm:col-span-2">
              {{ recovery.note }}
            </dd>
          </dl>
        </section>

        <section>
          <h4 class="mb-4 text-sm font-semibold uppercase tracking-wide text-grey-700">
            Adressen ({{ samples.length }})
          </h4>
          <p v-if="samples.length === 0" class="text-sm text-red-500">
            Voeg minimaal één adres toe in stap 2 voordat je het herstel indient.
          </p>
          <ul v-else class="divide-y divide-grey-200">
            <li v-for="s in samples" :key="s.id" class="py-3 text-sm">
              <p class="font-semibold text-grey-800">
                {{ formatAddress(addressStore.cache[s.building]) }}
              </p>
              <p v-if="s.note" class="text-xs text-grey-700">{{ s.note }}</p>
            </li>
          </ul>

          <p v-if="!canSubmit && samples.length > 0" class="mt-3 text-sm text-grey-700">
            Dit herstel kan niet meer worden ingediend in de huidige status.
          </p>
        </section>
      </div>
    </Card>
  </MainWrapper>
</template>
