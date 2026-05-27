<script setup lang="ts">
defineProps({
  title: { type: String, default: null },
})
</script>

<template>
  <div class="rounded-md border border-grey-200 bg-white p-5">
    <header v-if="title" class="card__header mb-4">
      <h3 class="text-base font-semibold text-grey-800">{{ title }}</h3>
    </header>
    <div class="card__content">
      <slot />
    </div>
    <footer v-if="$slots.footer" class="card__footer mt-4">
      <slot name="footer" />
    </footer>
  </div>
</template>
