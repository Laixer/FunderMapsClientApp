<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

import Icon from '@/components/Common/Icon.vue'
import type { IconName } from '@/components/Common/icons'
import UserMenu from '@/components/UserMenu.vue'
import fundermapsLogo from '@assets/svg/fundermaps.svg?url'

const { t } = useI18n()

const navLinks: { name: string; label: string; icon: IconName }[] = [
  { name: 'home', label: t('nav.today'), icon: 'target' },
  { name: 'inquiry-list', label: t('nav.reports'), icon: 'clipboard' },
  { name: 'recovery-list', label: t('nav.recoveries'), icon: 'switch' },
]
</script>

<template>
  <aside class="border-grey-200 fixed inset-y-0 left-0 z-40 flex w-56 flex-col border-r bg-white">
    <div class="border-grey-200 flex h-14 items-center border-b px-4">
      <RouterLink
        :to="{ name: 'inquiry-list' }"
        class="inline-flex items-center gap-2"
        aria-label="FunderMaps"
      >
        <img :src="fundermapsLogo" alt="FunderMaps" class="h-6 w-auto" />
      </RouterLink>
    </div>

    <nav class="flex-1 overflow-y-auto px-2 py-3">
      <ul class="flex flex-col gap-0.5">
        <li v-for="link in navLinks" :key="link.name">
          <RouterLink
            :to="{ name: link.name }"
            class="nav-link text-grey-700 hover:bg-grey-100 hover:text-grey-800 flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors"
          >
            <Icon :name="link.icon" size="sm" />
            {{ link.label }}
          </RouterLink>
        </li>
      </ul>
    </nav>

    <div class="border-grey-200 border-t p-3">
      <UserMenu />
    </div>
  </aside>
</template>

<style scoped>
.nav-link.router-link-active {
  background: var(--color-grey-100);
  color: var(--color-grey-800);
  font-weight: 600;
}

.nav-link.router-link-active::before {
  content: '';
  display: block;
  width: 3px;
  height: 1rem;
  margin-right: 0.5rem;
  margin-left: -0.75rem;
  border-radius: 0 2px 2px 0;
  background: var(--color-green-500);
}
</style>
