<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { onClickOutside, onKeyStroke } from '@vueuse/core'
import { useI18n } from 'vue-i18n'

import ExitIcon from '@assets/svg/icons/exit.svg'

import { useSessionStore } from '@/stores/session'
import { logoutRedirect } from '@/services/oidc'

const { t } = useI18n()
const sessionStore = useSessionStore()
const { currentUser } = storeToRefs(sessionStore)

const open = ref(false)
const root = ref<HTMLElement | null>(null)
onClickOutside(root, () => (open.value = false))
onKeyStroke('Escape', () => (open.value = false))

const userName = computed(() => {
  const u = currentUser.value
  if (!u) return 'onbekend'
  const full = [u.given_name, u.family_name].filter(Boolean).join(' ').trim()
  return full || u.email
})

const initials = computed(() => {
  const u = currentUser.value
  if (!u) return '??'
  const first = (u.given_name?.[0] ?? '').toUpperCase()
  const last = (u.family_name?.[0] ?? '').toUpperCase()
  if (first || last) return `${first}${last}` || '??'
  return (u.email?.slice(0, 2) ?? '??').toUpperCase()
})

const isAdministrator = computed(() => currentUser.value?.role === 'administrator')

// Other FunderMaps apps to jump to. Maps for everyone; Beheer (ManagementFront)
// only for administrators — non-admins would hit its 403 guard. Report is
// PDF-only (not a destination). Hardcoded for the fixed fleet.
const apps = computed(() => {
  const list: Array<{ label: string; url: string }> = [
    { label: t('userMenu.maps'), url: 'https://maps.fundermaps.com' },
  ]
  if (isAdministrator.value) {
    list.push({ label: t('userMenu.admin'), url: 'https://admin.fundermaps.com' })
  }
  return list
})

function handleLogout() {
  // RP-initiated logout — ends the SSO session at the provider (see oidc.ts).
  logoutRedirect()
}
</script>

<template>
  <div ref="root" class="relative">
    <button
      type="button"
      class="flex items-center gap-2 rounded-full p-1 pr-2 transition-colors hover:bg-grey-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500"
      :aria-expanded="open"
      aria-haspopup="menu"
      @click="open = !open"
    >
      <span
        class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-800"
        aria-hidden="true"
      >
        {{ initials }}
      </span>
      <span class="hidden text-sm font-medium text-grey-800 sm:inline">{{ userName }}</span>
    </button>

    <div
      v-if="open"
      role="menu"
      class="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-grey-200 bg-white py-2 shadow-card"
    >
      <p class="px-4 pb-1 text-xs font-semibold tracking-wide text-grey-700 uppercase">
        {{ t('userMenu.apps') }}
      </p>
      <a
        v-for="app in apps"
        :key="app.url"
        :href="app.url"
        role="menuitem"
        class="block px-4 py-2 text-sm text-grey-800 hover:bg-grey-100"
        @click="open = false"
      >
        {{ app.label }}
      </a>

      <hr class="my-2 border-grey-200" />

      <button
        type="button"
        role="menuitem"
        class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50"
        @click="handleLogout"
      >
        <ExitIcon class="aspect-square h-3.5" aria-hidden="true" />
        {{ t('auth.logout') }}
      </button>
    </div>
  </div>
</template>
