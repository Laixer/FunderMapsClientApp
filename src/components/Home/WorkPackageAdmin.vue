<script setup lang="ts">
import { computed, onBeforeMount, ref, watch } from 'vue'

import Button from '@/components/Common/Buttons/Button.vue'
import Field from '@/components/Common/Field.vue'
import Panel from '@/components/Common/Panel.vue'

import api from '@/services/fundermaps'
import type { IUser } from '@/services/fundermaps/interfaces/IUser'
import { describeFailure } from '@/services/fundermaps/errors'
import { toastError, toastSuccess } from '@/services/toast'
import { WORK_PACKAGES } from '@/services/workPackages'

/**
 * The admin composes a colleague's work packages (2026-10-09: the admin asked
 * to hand the packages out per person, so they show up in that person's
 * Vandaag on any computer instead of being ticked per browser).
 *
 * Only rendered for the global `administrator` role; the API refuses everyone
 * else anyway (/api/management/*). The colleagues are the org's reviewers, the
 * same list the dossier hand-over offers (`api.reviewer.list`): the management
 * user list has every account on the platform and no way to tell staff from
 * customers, and the API only accepts staff here.
 *
 * Saving an empty set hands the choice back to the colleague.
 */

const colleagues = ref<IUser[]>([])
/** userId → the set saved for them. Absent = they choose their own. */
const assignments = ref<Record<string, string[]>>({})
const userId = ref<string | null>(null)
const draft = ref<string[]>([])
const saving = ref(false)
const unavailable = ref(false)

const personName = (u: IUser) =>
  [u.given_name, u.family_name].filter(Boolean).join(' ').trim() || u.email

const options = computed(() =>
  colleagues.value
    .map((u) => ({
      value: u.id,
      label: `${personName(u)}${assignments.value[u.id]?.length ? ` (${assignments.value[u.id]!.length})` : ''}`,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'nl')),
)

const saved = computed(() => (userId.value ? (assignments.value[userId.value] ?? []) : []))
const dirty = computed(() => [...draft.value].sort().join() !== [...saved.value].sort().join())

onBeforeMount(async () => {
  try {
    const [people, { assignments: list }] = await Promise.all([
      api.reviewer.list(),
      api.management.workPackages(),
    ])
    colleagues.value = people
    assignments.value = Object.fromEntries(list.map((a) => [a.userId, a.packageIds]))
  } catch {
    // An API without the endpoint (404) or a hiccup: hide the panel rather
    // than offer a form that cannot save.
    unavailable.value = true
  }
})

watch(userId, () => {
  draft.value = [...saved.value]
})

function toggle(id: string) {
  draft.value = draft.value.includes(id)
    ? draft.value.filter((x) => x !== id)
    : [...draft.value, id]
}

async function save() {
  if (!userId.value || saving.value) return
  saving.value = true
  try {
    const r = await api.management.setWorkPackages(userId.value, draft.value)
    const next = { ...assignments.value }
    if (r.packageIds.length) next[r.userId] = r.packageIds
    else delete next[r.userId]
    assignments.value = next
    draft.value = [...r.packageIds]
    toastSuccess(
      r.packageIds.length
        ? 'Werkpakketten opgeslagen.'
        : 'Leeg opgeslagen: de collega kiest weer zelf.',
    )
  } catch (e) {
    toastError(describeFailure(e, 'Werkpakketten opslaan is niet gelukt'))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <Panel v-if="!unavailable">
    <template #header>
      <span class="text-strong text-lg font-bold">Werkpakketten van collega's</span>
    </template>
    <div class="mb-3 flex items-end gap-3">
      <div class="w-80">
        <Field
          v-model="userId"
          kind="select"
          label="Collega"
          :options="options"
          empty-label="Kies een collega"
        />
      </div>
      <p class="text-subtle text-sm">
        Wat je hier aanvinkt staat op Vandaag van die collega, op elke computer. Leeg opslaan: de
        collega kiest weer zelf.
      </p>
    </div>
    <template v-if="userId">
      <div class="grid grid-cols-3 gap-2">
        <label
          v-for="p in WORK_PACKAGES"
          :key="p.id"
          class="flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2"
          :class="
            draft.includes(p.id) ? 'border-green-border bg-green-wash' : 'border-line bg-surface'
          "
          :title="p.hint"
        >
          <input
            :id="`toewijzing-${p.id}`"
            type="checkbox"
            class="accent-green mt-1"
            :checked="draft.includes(p.id)"
            @change="toggle(p.id)"
          />
          <span class="text-body block text-base font-semibold">{{ p.title }}</span>
        </label>
      </div>
      <div class="mt-3">
        <Button label="Opslaan" variant="primary" :disabled="saving || !dirty" @click="save" />
      </div>
    </template>
  </Panel>
</template>
