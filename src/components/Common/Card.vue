<script setup lang="ts">
import { computed } from 'vue'

const { shadow, rounded, wide } = defineProps({
  title: { type: String, default: null },
  shadow: { type: Boolean, default: false },
  rounded: { type: Boolean, default: false },
  wide: { type: Boolean, default: false },
})

const cardClasses = computed<string[]>(() => {
  const classes = []
  if (shadow) classes.push('shadow-card')
  if (rounded) classes.push('rounded-lg')
  if (wide) classes.push('temp')
  return classes
})
</script>

<template>
  <div class="card bg-white | grid space-y-5 p-5" :class="cardClasses">
    <header v-if="title" class="card__header">
      <h3 class="heading-3">{{ title }}</h3>
    </header>
    <div class="card__content space-y-6">
      <slot />
    </div>
    <footer class="card__footer">
      <slot name="footer" />
    </footer>
  </div>
</template>
