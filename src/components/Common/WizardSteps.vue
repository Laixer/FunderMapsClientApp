<script setup lang="ts">
withDefaults(
  defineProps<{
    steps: string[]
    current: number // 1-indexed
  }>(),
  {},
)
</script>

<template>
  <ol class="flex flex-wrap items-center gap-2 text-sm">
    <template v-for="(label, idx) in steps" :key="idx">
      <li class="flex items-center gap-2">
        <span
          class="inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold"
          :class="
            idx + 1 === current
              ? 'border-green-500 bg-green-500 text-white'
              : idx + 1 < current
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-grey-200 bg-white text-grey-700'
          "
        >
          {{ idx + 1 }}
        </span>
        <span
          class="font-medium"
          :class="idx + 1 === current ? 'text-grey-800' : 'text-grey-700'"
        >
          {{ label }}
        </span>
      </li>
      <li
        v-if="idx < steps.length - 1"
        class="text-grey-400"
        aria-hidden="true"
      >
        ›
      </li>
    </template>
  </ol>
</template>
