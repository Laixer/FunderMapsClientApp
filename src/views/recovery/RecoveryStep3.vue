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
import WizardSteps from '@/components/Common/WizardSteps.vue'
import { RouterLink } from 'vue-router'

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
    <div class="mb-8 space-y-3">
      <RouterLink
        :to="{ name: 'recovery-list' }"
        class="inline-flex items-center gap-1 text-xs font-medium text-grey-700 hover:text-grey-800"
      >
        ← {{ t('recovery.view.back') }}
      </RouterLink>
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 class="text-2xl font-semibold text-grey-800">Controle</h2>
          <p v-if="recovery" class="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-grey-700">
            <span>{{ recoveryDocumentTypeLabel(recovery.type) }}</span>
            <span aria-hidden="true">·</span>
            <span>{{ formatDate(recovery.documentDate) }}</span>
            <StatusBadge :status="recovery.state.auditStatus" />
          </p>
        </div>
        <div class="flex gap-2">
          <Button lg outline label="Vorige" @click="previous" />
          <Button
            lg
            label="Aanbieden ter review"
            :disabled="!canSubmit || submitting"
            @click="submit"
          />
        </div>
      </div>
      <WizardSteps :steps="['Gegevens', 'Adressen', 'Controle']" :current="3" />
    </div>

    <Alert v-if="error" :closeable="true" class="mb-3" @close="error = null">{{ error }}</Alert>

    <Card v-if="loading" class="flex justify-center py-8">
      <Spinner />
      <span v-if="false">{{ t('common.loading') }}</span>
    </Card>

    <Card v-else-if="recovery">
      <div class="space-y-6">
        <section>
          <h4 class="mb-3 text-xs font-semibold uppercase tracking-wide text-grey-700">
            Document
          </h4>
          <dl class="grid grid-cols-[10rem_1fr] gap-x-4 gap-y-2 text-sm">
            <dt class="text-grey-700">Naam</dt>
            <dd class="text-grey-800">{{ recovery.documentName }}</dd>

            <dt class="text-grey-700">Opsteller</dt>
            <dd class="text-grey-800">{{ recovery.attribution.creatorName ?? '—' }}</dd>

            <dt class="text-grey-700">Beoordelaar</dt>
            <dd class="text-grey-800">{{ recovery.attribution.reviewerName ?? '—' }}</dd>

            <dt class="text-grey-700">Uitvoerder</dt>
            <dd class="text-grey-800">{{ recovery.attribution.contractorName ?? '—' }}</dd>

            <template v-if="recovery.note">
              <dt class="text-grey-700">Notitie</dt>
              <dd class="whitespace-pre-wrap text-grey-800">{{ recovery.note }}</dd>
            </template>
          </dl>
        </section>

        <section>
          <h4 class="mb-3 text-xs font-semibold uppercase tracking-wide text-grey-700">
            Adressen ({{ samples.length }})
          </h4>
          <Alert v-if="samples.length === 0" type="warning">
            Voeg minimaal één adres toe in stap 2 voordat je het herstel indient.
          </Alert>
          <ul v-else class="overflow-hidden rounded-md border border-grey-200">
            <li
              v-for="s in samples"
              :key="s.id"
              class="space-y-1 border-b border-grey-200 px-3 py-3 text-sm last:border-b-0"
            >
              <p class="font-medium text-grey-800">
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
