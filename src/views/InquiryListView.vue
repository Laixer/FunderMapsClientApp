<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import MainWrapper from '@/components/Layout/MainWrapper.vue'

const { t } = useI18n()
</script>

<template>
  <MainWrapper>
    <main class="col-span-3 mt-16 p-8">
      <h1 class="text-2xl text-blue-900">{{ t('nav.reports') }}</h1>
      <p class="mt-3 text-grey-700">[placeholder — komt nog]</p>
    </main>
  </MainWrapper>
</template>
