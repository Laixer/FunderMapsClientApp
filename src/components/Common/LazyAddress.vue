<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { resolveWhenVisible } from '@/services/addressOnSight'
import { useAddressStore } from '@/stores/address'
import { formatAddress } from '@/utils/address'

/**
 * A pand's address in a long list: looked up when the row is on screen, with
 * the pand id standing in until the address is there (and staying, in the mono
 * face an id gets everywhere, when the geocoder does not know the pand).
 *
 * A component rather than a line in the list's template, so that an address
 * arriving redraws this one label and not a list of two thousand rows.
 */
const props = defineProps<{
  /** Whatever the address store resolves: a BAG pand id, a nummeraanduiding, a `gfm-` id. */
  id: string
}>()

const store = useAddressStore()
const address = computed(() => store.cache[props.id] ?? null)

const root = ref<HTMLElement | null>(null)
let stopWatching: (() => void) | null = null

function watchRow() {
  stopWatching?.()
  stopWatching = root.value && !address.value ? resolveWhenVisible(root.value, props.id) : null
}

onMounted(watchRow)
watch(() => props.id, watchRow)
// Another row of the same pand may bring the address in first.
watch(address, (found) => {
  if (found) watchRow()
})
onBeforeUnmount(() => stopWatching?.())
</script>

<template>
  <span ref="root" :class="address ? undefined : 'font-mono'">{{
    address ? formatAddress(address) : id
  }}</span>
</template>
