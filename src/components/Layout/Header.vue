<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

import UserMenu from '@/components/UserMenu.vue'
import fundermapsLogo from '@assets/svg/fundermaps.svg?url'

const { t } = useI18n()

const navLinks = [
  { name: 'dashboard', label: t('nav.dashboard') },
  { name: 'inquiry-list', label: t('nav.reports') },
]
</script>

<template>
  <header
    class="app-header fixed inset-x-0 top-0 isolate z-50 flex h-16 items-center gap-8 bg-white/85 px-6 shadow-[0_1px_0_0_theme(colors.grey.200)] backdrop-blur supports-[backdrop-filter]:bg-white/75"
  >
    <RouterLink
      :to="{ name: 'dashboard' }"
      class="flex-shrink-0 outline-none"
      aria-label="FunderMaps"
    >
      <img :src="fundermapsLogo" alt="FunderMaps" class="h-7 w-auto" />
    </RouterLink>

    <nav class="flex h-full items-stretch gap-1">
      <RouterLink
        v-for="link in navLinks"
        :key="link.name"
        :to="{ name: link.name }"
        class="nav-link relative inline-flex items-center px-4 text-sm font-semibold text-grey-700 transition-colors hover:text-grey-800"
      >
        {{ link.label }}
      </RouterLink>
    </nav>

    <div class="ml-auto">
      <UserMenu />
    </div>
  </header>
</template>

<style scoped>
.nav-link::after {
  content: '';
  position: absolute;
  left: 1rem;
  right: 1rem;
  bottom: -1px;
  height: 2px;
  border-radius: 2px 2px 0 0;
  background: theme(colors.green.500);
  transform: scaleX(0);
  transform-origin: center;
  transition: transform 180ms ease;
}

.nav-link.router-link-active {
  color: theme(colors.grey.800);
}

.nav-link.router-link-active::after {
  transform: scaleX(1);
}

.nav-link:hover::after {
  transform: scaleX(0.4);
}

.nav-link.router-link-active:hover::after {
  transform: scaleX(1);
}
</style>
