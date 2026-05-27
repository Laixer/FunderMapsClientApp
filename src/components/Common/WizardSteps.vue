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
  <ol class="flex flex-wrap items-center gap-3 text-sm">
    <template v-for="(label, idx) in steps" :key="idx">
      <li class="flex items-center gap-2.5">
        <span
          class="inline-flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold transition-colors"
          :class="
            idx + 1 === current
              ? 'border-green-500 bg-green-500 text-white shadow-sm'
              : idx + 1 < current
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-grey-200 bg-white text-grey-700'
          "
        >
          {{ idx + 1 }}
        </span>
        <span
          class="text-sm font-medium"
          :class="idx + 1 === current ? 'text-grey-800' : 'text-grey-700'"
        >
          {{ label }}
        </span>
      </li>
      <li
        v-if="idx < steps.length - 1"
        class="h-px w-10 transition-colors"
        :class="idx + 1 < current ? 'bg-green-500' : 'bg-grey-200'"
        aria-hidden="true"
      />
    </template>
  </ol>
</template>
