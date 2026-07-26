<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { onClickOutside, onKeyStroke } from '@vueuse/core'
import { useI18n } from 'vue-i18n'

import { useSessionStore } from '@/stores/session'
import { logoutRedirect } from '@/services/oidc'

/**
 * Who you are, at the foot of the rail.
 *
 * The second line — organisation and role — is not decoration: this app shows
 * different actions to a verifier and a writer, and "why can't I approve this?"
 * is answered faster by a line that says `FunderMaps B.V. · Beoordelaar` than
 * by a support thread.
 */
const { t } = useI18n()
const sessionStore = useSessionStore()
const { currentUser, orgRole } = storeToRefs(sessionStore)

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

const ROLE_LABELS: Record<string, string> = {
  superuser: 'Beheerder',
  verifier: 'Beoordelaar',
  writer: 'Opsteller',
  reader: 'Lezer',
}

/** `Organisatie · Rol`, with whichever half we actually know. */
const subtitle = computed(() => {
  const org = currentUser.value?.organizations?.[0]?.name
  const role = orgRole.value ? ROLE_LABELS[orgRole.value] : null
  return [org, role].filter(Boolean).join(' · ') || '—'
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
  <div ref="root" class="relative border-t border-divider pt-3">
    <button
      type="button"
      class="flex w-full items-center gap-2.5 rounded-lg px-1 py-1 text-left hover:bg-sunken"
      :aria-expanded="open"
      aria-haspopup="menu"
      @click="open = !open"
    >
      <span
        class="text-xs inline-flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-green-tint font-bold text-green-ink"
        aria-hidden="true"
      >
        {{ initials }}
      </span>
      <span class="min-w-0 flex-1">
        <span class="text-md block truncate font-semibold text-strong">{{ userName }}</span>
        <span class="text-xs block truncate text-faint">{{ subtitle }}</span>
      </span>
    </button>

    <!-- Opens upward: this menu lives at the bottom of the full-height sidebar,
         so a downward dropdown would render below the viewport and the
         logout/app-switcher items would be unclickable. -->
    <div
      v-if="open"
      role="menu"
      class="studio-fade absolute bottom-full left-0 z-50 mb-2 w-full overflow-hidden rounded-xl border border-line bg-surface py-1.5 shadow-overlay"
    >
      <p class="studio-label px-3 py-1.5">{{ t('userMenu.apps') }}</p>
      <a
        v-for="app in apps"
        :key="app.url"
        :href="app.url"
        role="menuitem"
        class="text-md block px-3 py-2 text-body hover:bg-canvas"
        @click="open = false"
      >
        {{ app.label }}
      </a>

      <hr class="my-1.5 border-divider" />

      <button
        type="button"
        role="menuitem"
        class="text-md flex w-full items-center gap-2 px-3 py-2 text-left text-red hover:bg-red-wash"
        @click="handleLogout"
      >
        {{ t('auth.logout') }}
      </button>
    </div>
  </div>
</template>
