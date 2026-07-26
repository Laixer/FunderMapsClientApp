<script setup lang="ts">
import { computed } from 'vue'

import Pill from '@/components/Common/Pill.vue'
import { statusMeta } from '@/services/inquiryEnums'

/**
 * A dossier's audit status as a pill. The one place the status integer turns
 * into something a person can read, so the label and the colour can never
 * disagree between two screens.
 */
const props = defineProps<{ status: number | null | undefined }>()

const meta = computed(() => statusMeta(props.status))
</script>

<template>
  <Pill :label="meta.label" :tone="meta.tone" />
</template>
