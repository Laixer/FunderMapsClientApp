<script setup lang="ts">
import { computed } from 'vue'

import ChainRow from '@/components/Common/ChainRow.vue'
import type { IRapportageOrigin } from '@/services/fundermaps/interfaces/IDataops'
import { originSteps, type OriginInput } from '@/services/rapportageOrigin'

/**
 * The rapportage's road back to where it came from, and what it changed in
 * FunderMaps after (services/rapportageOrigin.ts). The dossier page shows the
 * same road forward; both are a ChainRow, so they look the same.
 */
const props = defineProps<{ origin: IRapportageOrigin; rapportage: OriginInput }>()

const steps = computed(() => originSteps(props.origin, props.rapportage))
</script>

<template>
  <ChainRow :steps="steps" label="Herkomst van deze rapportage" now-word="deze rapportage" inset stacked />
</template>
