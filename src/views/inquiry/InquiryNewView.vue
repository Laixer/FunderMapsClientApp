<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import AppShell from '@/components/Layout/AppShell.vue'
import WizardHeader from '@/components/Layout/WizardHeader.vue'
import Button from '@/components/Common/Buttons/Button.vue'
import Callout from '@/components/Common/Callout.vue'
import Field from '@/components/Common/Field.vue'
import Panel from '@/components/Common/Panel.vue'
import AddressPicker from '@/components/Inquiry/AddressPicker.vue'

import api from '@/services/fundermaps'
import type { IAddress } from '@/services/fundermaps/interfaces/IAddress'
import { describeFailure } from '@/services/fundermaps/errors'
import type { SelectOption } from '@/services/options'
import { formatBytes } from '@/services/documentFile'
import { toastSuccess } from '@/services/toast'
import { formatAddress } from '@/utils/address'
import { useActionShortcuts } from '@/services/useActionShortcuts'
import { useStudioStore } from '@/stores/studio'

/**
 * Nieuwe rapportage: drop the document, the pipeline reads it, you judge it.
 *
 * This replaced the three-step entry wizard on 2026-09-07. The wizard had a
 * person type a report's values into forms and a second person check them;
 * the review lane has the model read the report and one person judge each
 * value against its citation. Both produced the same rows in report.*, and
 * of the ~1,100 wizard entries in the 90 days before, 996 were still waiting
 * for that second person. So: one front door. Typing is still there -- on
 * the samples of the inquiry a commit creates -- as the fallback for a
 * document the model cannot read, not as the way in.
 *
 * Three questions, because three things cannot be read off the page: which
 * files, what the uploader says they are (a QuickScan may not establish a
 * foundation type, and that gate needs the label before the model sees a
 * page), and which building, when the uploader knows it.
 */
const router = useRouter()
const studio = useStudioStore()

const ACCEPT = 'application/pdf,image/jpeg,image/png,image/tiff'
const MAX_BYTES = 40 * 1024 * 1024
const MAX_FILES = 10

const CATEGORY_OPTIONS: SelectOption[] = [
  { value: 'foundationresearch', label: 'Funderingsonderzoek (eigen inmeting, F3O, inspectieput)' },
  { value: 'archieveresearch', label: 'Archiefonderzoek / bouwtekeningen' },
  { value: 'quickscan', label: 'QuickScan / Fase 0 / funderingsrisicorapport' },
  { value: 'herstelbewijs', label: 'Herstelbewijs' },
  { value: 'foto', label: "Foto's" },
  { value: 'overig', label: 'Overig / weet ik niet' },
]

const files = ref<File[]>([])
const category = ref<string | null>(null)
const subject = ref('')
const address = ref<IAddress | null>(null)
const dragging = ref(false)
const submitting = ref(false)
const error = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

function add(list: FileList | File[] | null) {
  if (!list) return
  error.value = null
  for (const f of Array.from(list)) {
    if (files.value.length >= MAX_FILES) {
      error.value = `Maximaal ${MAX_FILES} bestanden per dossier.`
      break
    }
    if (f.size > MAX_BYTES) {
      error.value = `${f.name} is groter dan ${formatBytes(MAX_BYTES)}.`
      continue
    }
    if (files.value.some((x) => x.name === f.name && x.size === f.size)) continue
    files.value = [...files.value, f]
  }
  // A suggestion, never an override.
  if (!subject.value.trim() && files.value[0]) {
    subject.value = files.value[0].name.replace(/\.[a-z0-9]+$/i, '').slice(0, 200)
  }
}
function remove(i: number) {
  files.value = files.value.filter((_, j) => j !== i)
}
function onDrop(e: DragEvent) {
  dragging.value = false
  add(e.dataTransfer?.files ?? null)
}
function onPickInput(e: Event) {
  const input = e.target as HTMLInputElement
  add(input.files)
  input.value = ''
}

const totalBytes = computed(() => files.value.reduce((n, f) => n + f.size, 0))
const canSubmit = computed(() => files.value.length > 0 && !!category.value && !submitting.value)

async function submit() {
  if (!canSubmit.value) return
  submitting.value = true
  error.value = null
  try {
    const r = await api.dataops.create(files.value, {
      subject: subject.value.trim() || undefined,
      category: category.value!,
      building: address.value?.building_id ?? null,
    })
    void studio.refreshCounts(null)
    toastSuccess(
      r.reading
        ? `Dossier ${r.reference} aangemaakt; het document wordt nu gelezen.`
        : `Dossier ${r.reference} aangemaakt; het wordt bij de volgende ronde gelezen.`,
    )
    await router.push({ name: 'review-dossier', params: { id: r.id } })
  } catch (e) {
    error.value = describeFailure(e, 'Het dossier kon niet worden aangemaakt.')
  } finally {
    submitting.value = false
  }
}

useActionShortcuts(() => ({ '⌘↵': submit }))
</script>

<template>
  <AppShell crumb="Nieuwe rapportage">
    <WizardHeader title="Nieuwe rapportage" status="document → gelezen door de pipeline → jouw oordeel">
      <template #actions>
        <Button label="Annuleren" @click="router.push({ name: 'inquiry-list' })" />
        <Button
          variant="primary"
          :label="submitting ? 'Bezig…' : 'Aanmaken en lezen'"
          shortcut="⌘↵"
          :disabled="!canSubmit"
          @click="submit"
        />
      </template>
    </WizardHeader>

    <div class="grid grid-cols-[minmax(0,1fr)_var(--spacing-drawer)] items-start gap-4.5 px-6 py-5">
      <div class="flex min-w-0 flex-col gap-4">
        <p class="text-lg text-muted">
          Upload het rapport. De pipeline leest de waarden eruit, met per waarde het citaat waar
          die vandaan komt; jij neemt ze over, past ze aan of keurt ze af. Leest de pipeline niets,
          dan maak je vanuit de controle alsnog een rapportage aan en vul je die met de hand.
        </p>

        <Panel caption="DOCUMENT" :meta="files.length ? `${files.length} · ${formatBytes(totalBytes)}` : undefined">
          <div
            class="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors"
            :class="dragging ? 'border-green bg-green-tint' : 'border-line bg-sunken'"
            @dragenter.prevent="dragging = true"
            @dragover.prevent="dragging = true"
            @dragleave.prevent="dragging = false"
            @drop.prevent="onDrop"
          >
            <p class="text-md text-body">Sleep het rapport hierheen, of</p>
            <Button label="Kies bestanden" @click="fileInput?.click()" />
            <p class="text-sm text-faint">
              PDF of afbeelding · max {{ formatBytes(MAX_BYTES) }} per bestand · meerdere bestanden =
              één dossier
            </p>
            <input
              ref="fileInput"
              type="file"
              class="hidden"
              multiple
              :accept="ACCEPT"
              @change="onPickInput"
            />
          </div>

          <ul v-if="files.length" class="mt-3 flex flex-col gap-1.5">
            <li
              v-for="(f, i) in files"
              :key="`${f.name}-${f.size}`"
              class="text-md flex items-center gap-3 rounded-md border border-line px-3 py-1.5"
            >
              <span class="min-w-0 flex-1 truncate text-body">{{ f.name }}</span>
              <span class="shrink-0 font-mono text-sm text-faint">{{ formatBytes(f.size) }}</span>
              <Button label="Verwijder" @click="remove(i)" />
            </li>
          </ul>

          <p v-if="error" class="mt-2 text-md text-red">{{ error }}</p>
        </Panel>

        <Panel caption="WAT IS DIT" meta="verplicht">
          <div class="grid grid-cols-2 gap-x-4 gap-y-3">
            <Field
              v-model="category"
              label="Soort document"
              kind="select"
              required
              :options="CATEGORY_OPTIONS"
              empty-label="Kies wat je uploadt"
              hint="een QuickScan mag geen funderingstype vaststellen; daarom vragen we dit vooraf"
            />
            <Field
              v-model="subject"
              label="Onderwerp"
              placeholder="bijv. Adamshofstraat 81–105, Fase 1"
              hint="wat de controleur in de wachtrij ziet"
            />
          </div>
        </Panel>
      </div>

      <aside class="flex flex-col gap-4">
        <Panel caption="PAND" meta="optioneel">
          <div v-if="address" class="flex flex-col gap-2">
            <p class="text-md font-semibold text-body">{{ formatAddress(address) }}</p>
            <p class="font-mono text-sm text-faint">{{ address.building_id }}</p>
            <Button label="Ander pand" @click="address = null" />
          </div>
          <template v-else>
            <AddressPicker @pick="address = $event" />
            <p class="mt-2 text-sm text-faint">
              Het hoofdadres van het rapport, als je het weet. De pipeline herkent de adressen in
              het document zelf ook.
            </p>
          </template>
        </Panel>

        <Callout tone="green" title="Hierna: controle" plain>
          Het dossier opent meteen in de controle. Het lezen duurt meestal een halve tot twee
          minuten; ververs de pagina als er nog niets staat.
        </Callout>
      </aside>
    </div>
  </AppShell>
</template>
