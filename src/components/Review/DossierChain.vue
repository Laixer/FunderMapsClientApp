<script setup lang="ts">
import { computed } from 'vue'

import ChainRow from '@/components/Common/ChainRow.vue'
import type { IReviewDossier, VerdictOutcome } from '@/services/fundermaps/interfaces/IDataops'
import { dossierChain } from '@/services/dossierChain'

/**
 * The dossier's road from document to FunderMaps, in one row under the header
 * (services/dossierChain.ts, drawn by ChainRow). The colours are the
 * Datastroom's: green passed, amber where the dossier is now, grey where it
 * was closed, a hollow dot for what it has not reached.
 *
 * It follows the reviewer: a verdict given on this page moves "Beoordeeld"
 * at once, without reloading.
 */
const props = defineProps<{
  data: IReviewDossier
  decided: Record<number, VerdictOutcome>
  closedNow?: string | null
}>()

const steps = computed(() => dossierChain(props.data, props.decided, props.closedNow ?? null))
</script>

<template>
  <ChainRow :steps="steps" label="Van document tot FunderMaps" />
</template>
