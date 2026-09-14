<script setup lang="ts">
import { computed, ref } from 'vue'

import AddressPicker from '@/components/Inquiry/AddressPicker.vue'
import Button from '@/components/Common/Buttons/Button.vue'
import Panel from '@/components/Common/Panel.vue'
import Pill from '@/components/Common/Pill.vue'
import api from '@/services/fundermaps'
import type { IAddress } from '@/services/fundermaps/interfaces/IAddress'
import type { IDossierAddress, AddressVerdictOutcome } from '@/services/fundermaps/interfaces/IDataops'
import { describeFailure } from '@/services/fundermaps/errors'
import type { Tone } from '@/services/tone'

/**
 * The addresses a dossier is about (#333, points 3 and 4).
 *
 * A funderingsonderzoek covers a block; a melding is filed under one house.
 * This panel shows every address the dossier has -- the pand it was filed
 * under first, then what the document names, then what a reviewer added --
 * and lets the reviewer say which of them belong. "Hoort er niet bij" is
 * Don's ruling on what afkeuren means here: the address is not part of this
 * dossier, so its values are put aside and it never becomes a sample. A wrong
 * match (59 where the report says 59A) is not a rejection but a re-link, and
 * an address the pipeline missed is added by hand and gets an empty sample
 * on commit, to be filled in there.
 *
 * Every action answers with the fresh list; when values changed hands (moved,
 * put aside, brought back) the parent is told to refresh its fields too.
 */
const props = defineProps<{
  dossierId: number
  addresses: IDossierAddress[]
  /** Closed or committed: show, do not act. */
  disabled?: boolean
}>()
const emit = defineEmits<{
  /** The fresh list; `fieldsChanged` when values moved or changed state. */
  updated: [addresses: IDossierAddress[], fieldsChanged: boolean]
  error: [message: string]
}>()

const busy = ref<string | null>(null)
/** Which row has its address picker open: a row key, `own` for the pand, `add` for a new address. */
const picking = ref<string | null>(null)

const STATE_LABEL: Record<IDossierAddress['state'], string> = {
  pending: 'te bevestigen',
  confirmed: 'bevestigd',
  rejected: 'hoort er niet bij',
}
const STATE_TONE: Record<IDossierAddress['state'], Tone> = {
  pending: 'amber',
  confirmed: 'green',
  rejected: 'red',
}
const SOURCE_LABEL: Record<IDossierAddress['source'], string> = {
  pipeline: 'gelezen uit het document',
  reviewer: 'handmatig toegevoegd',
  melder: 'adres van de melding',
}

const rejected = computed(() => props.addresses.filter((a) => a.state === 'rejected').length)
const meta = computed(() => {
  const n = props.addresses.length
  return rejected.value ? `${n}, ${rejected.value} hoort er niet bij` : String(n)
})

/** How the row is described under the label. */
function origin(a: IDossierAddress): string {
  if (a.own) return a.addressText ? `pand van het dossier · in het document: ${a.addressText}` : 'pand van het dossier'
  if (a.source === 'pipeline' && a.addressText && a.label && a.addressText !== a.label) {
    return `in het document: ${a.addressText}`
  }
  return SOURCE_LABEL[a.source]
}
function counts(a: IDossierAddress): string | null {
  if (!a.total && !a.open) return a.state === 'rejected' ? null : 'nog geen waarden'
  return a.open ? `${a.open} open · ${a.total} waarde${a.total === 1 ? '' : 'n'}` : `${a.total} waarde${a.total === 1 ? '' : 'n'}`
}

async function run(key: string, fieldsChanged: boolean, call: () => Promise<{ addresses: IDossierAddress[] }>) {
  busy.value = key
  try {
    const r = await call()
    picking.value = null
    emit('updated', r.addresses, fieldsChanged)
  } catch (e) {
    emit('error', describeFailure(e, 'De adreswijziging kon niet worden opgeslagen.'))
  } finally {
    busy.value = null
  }
}

function verdict(a: IDossierAddress, outcome: AddressVerdictOutcome) {
  const body = a.addressId ? { addressId: a.addressId, outcome } : { addressText: a.addressText ?? '', outcome }
  // Rejecting and taking that back change field states; confirming does not.
  return run(a.key, outcome !== 'confirmed', () => api.dataops.addressVerdict(props.dossierId, body))
}

/** Move every value of this row to the picked address (the 59 vs 59A case, or an unresolved text). */
function relink(a: IDossierAddress, target: IAddress) {
  const from = a.addressId ? { addressId: a.addressId } : { addressText: a.addressText ?? '' }
  return run(a.key, true, () => api.dataops.addressRelink(props.dossierId, { to: target.id, ...from }))
}

function add(target: IAddress) {
  return run('add', false, () => api.dataops.addressAdd(props.dossierId, { addressId: target.id }))
}

function setBuilding(target: IAddress) {
  return run('own', false, () => api.dataops.setBuilding(props.dossierId, target.id))
}

/** One line for an address, for the picker's header. */
const title = (a: IDossierAddress) => a.label ?? a.addressText ?? '—'
</script>

<template>
  <Panel caption="ADRESSEN" :meta="meta">
    <p v-if="!addresses.length" class="text-md text-muted">
      Dit dossier heeft nog geen adres: geen pand bij de melding, en het document noemt er geen.
      Voeg het adres toe waar het over gaat.
    </p>

    <ul v-else class="flex flex-col">
      <li
        v-for="a in addresses"
        :key="a.key"
        class="flex flex-col gap-1.5 border-b border-divider py-2 first:pt-0 last:border-b-0 last:pb-0"
        :class="{ 'opacity-60': a.state === 'rejected' }"
      >
        <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span class="min-w-0 truncate font-semibold text-body" :class="{ 'line-through': a.state === 'rejected' }">
            <template v-if="a.label">{{ a.label }}</template>
            <template v-else>{{ a.addressText }}</template>
          </span>
          <Pill v-if="a.own" label="pand van het dossier" tone="blue" plain />
          <Pill
            v-else-if="!a.addressId"
            :label="a.state === 'rejected' ? STATE_LABEL.rejected : 'adres niet herkend'"
            :tone="a.state === 'rejected' ? 'red' : 'amber'"
            plain
          />
          <Pill v-else :label="STATE_LABEL[a.state]" :tone="STATE_TONE[a.state]" plain />
          <span v-if="counts(a)" class="text-sm ml-auto shrink-0 font-mono text-faint">{{ counts(a) }}</span>
        </div>
        <p class="text-sm text-muted">
          {{ origin(a) }}<template v-if="a.note"> · “{{ a.note }}”</template>
        </p>

        <div v-if="!disabled" class="flex flex-wrap items-center gap-1.5">
          <!-- The dossier's own pand: only changed, never rejected. -->
          <template v-if="a.own">
            <Button
              :label="picking === 'own' ? 'Annuleren' : 'Ander pand…'"
              :disabled="busy !== null"
              @click="picking = picking === 'own' ? null : 'own'"
            />
          </template>

          <!-- An address the Worker could not resolve: link it, or put it aside. -->
          <template v-else-if="!a.addressId">
            <template v-if="a.state !== 'rejected'">
              <Button
                variant="primary"
                :label="picking === a.key ? 'Annuleren' : 'Koppel aan adres…'"
                :disabled="busy !== null"
                @click="picking = picking === a.key ? null : a.key"
              />
              <Button variant="danger" label="Hoort er niet bij" :disabled="busy !== null" @click="verdict(a, 'rejected')" />
            </template>
            <Button v-else label="Terugnemen" :disabled="busy !== null" @click="verdict(a, 'pending')" />
          </template>

          <template v-else>
            <Button
              v-if="a.state === 'pending'"
              variant="primary"
              label="Bevestigen"
              :disabled="busy !== null"
              @click="verdict(a, 'confirmed')"
            />
            <Button
              v-if="a.state !== 'rejected'"
              variant="danger"
              label="Hoort er niet bij"
              :disabled="busy !== null"
              @click="verdict(a, 'rejected')"
            />
            <Button v-else label="Terugnemen" :disabled="busy !== null" @click="verdict(a, 'pending')" />
            <Button
              v-if="a.state !== 'rejected' && a.total > 0"
              variant="ghost"
              :label="picking === a.key ? 'Annuleren' : 'Waarden naar ander adres…'"
              :disabled="busy !== null"
              @click="picking = picking === a.key ? null : a.key"
            />
          </template>
        </div>

        <!-- The picker for this row: a new pand, or the address its values move to. -->
        <div v-if="picking === (a.own ? 'own' : a.key)" class="rounded-lg border border-line bg-sunken p-2.5">
          <p class="text-sm mb-1.5 text-muted">
            <template v-if="a.own">Nieuw pand voor dit dossier.</template>
            <template v-else>Alle waarden van “{{ title(a) }}” gaan naar het gekozen adres.</template>
          </p>
          <AddressPicker @pick="(addr) => (a.own ? setBuilding(addr) : relink(a, addr))" />
        </div>
      </li>
    </ul>

    <!-- An address the document names but the pipeline did not find. -->
    <div v-if="!disabled" class="mt-3 flex flex-col gap-2">
      <div v-if="picking === 'add'" class="rounded-lg border border-line bg-sunken p-2.5">
        <p class="text-sm mb-1.5 text-muted">
          Het adres komt bevestigd op het dossier en wordt bij overnemen een adres van de rapportage, ook
          zonder waarden; die vul je daar in.
        </p>
        <AddressPicker @pick="add" />
      </div>
      <div class="flex gap-1.5">
        <Button
          :label="picking === 'add' ? 'Annuleren' : 'Adres toevoegen…'"
          :disabled="busy !== null"
          @click="picking = picking === 'add' ? null : 'add'"
        />
      </div>
    </div>
  </Panel>
</template>
