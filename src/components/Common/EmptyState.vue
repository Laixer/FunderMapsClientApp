<script setup lang="ts">
/**
 * Nothing here — said in one grey line.
 *
 * No illustration, no centred icon, no "Get started!" card. An empty lane in
 * this app usually means *you are done*, and a celebration graphic every time
 * someone clears their queue gets old by Tuesday.
 */
withDefaults(defineProps<{ dashed?: boolean }>(), { dashed: false })
</script>

<template>
  <p
    class="text-md rounded-xl px-3.5 py-3 text-muted"
    :class="dashed ? 'border border-dashed border-line-strong bg-raised' : ''"
  >
    <slot />
  </p>
</template>
