<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'

import ExitIcon from '@assets/svg/icons/exit.svg'

import { useSessionStore } from '@/stores/session'

const sessionStore = useSessionStore()
const { currentUser } = storeToRefs(sessionStore)

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

async function handleLogout() {
  await sessionStore.logoutAndRedirect()
}
</script>

<template>
  <div class="flex items-center gap-3">
    <div class="flex items-center gap-2">
      <span
        class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-800"
        aria-hidden="true"
      >
        {{ initials }}
      </span>
      <span class="hidden text-sm font-medium text-grey-800 sm:inline">{{ userName }}</span>
    </div>
    <button
      type="button"
      class="inline-flex h-8 w-8 items-center justify-center rounded-full text-grey-700 transition-colors hover:bg-red-50 hover:text-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500"
      :aria-label="`Uitloggen ${userName}`"
      title="Uitloggen"
      @click="handleLogout"
    >
      <ExitIcon class="aspect-square h-3.5" aria-hidden="true" />
    </button>
  </div>
</template>
