<script setup lang="ts">
import { computed } from 'vue'
import { statusMeta } from '@/services/inquiryEnums'

const props = defineProps<{ status: number | null | undefined }>()

const meta = computed(() => statusMeta(props.status))
</script>

<template>
  <span
    class="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium"
    :class="meta.classes"
  >
    {{ meta.label }}
  </span>
</template>
