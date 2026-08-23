<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppShell from '@/components/Layout/AppShell.vue'
import Button from '@/components/Common/Buttons/Button.vue'
import Callout from '@/components/Common/Callout.vue'
import EmptyState from '@/components/Common/EmptyState.vue'
import Field from '@/components/Common/Field.vue'
import Panel from '@/components/Common/Panel.vue'
import Pill from '@/components/Common/Pill.vue'
import api from '@/services/fundermaps'
import type {
  IReviewDossier,
  IProposedField,
  VerdictOutcome,
} from '@/services/fundermaps/interfaces/IDataops'
import { describeFailure } from '@/services/fundermaps/errors'
import { FOUNDATION_TYPE_OPTIONS } from '@/services/sampleEnums'

/**
 * Judging one submission.
 *
 * A proposed value cannot be judged on its own, so three things sit together:
 * what the pipeline read, the passage it read it from, and the document itself.
 * If the citation matches the page, the answer is sound — which is exactly how
 * Don worked through 83 of these by hand, and how every real fault in the
 * pipeline has been found so far.
 *
 * Decisions are per value. A document routinely yields six where five are solid
 * and one is a stretch; one verdict for the whole thing would either discard
 * the good ones or wave the bad one through.
 */
const route = useRoute()
const router = useRouter()

const data = ref<IReviewDossier | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const busy = ref<number | null>(null)
const decided = ref<Record<number, VerdictOutcome>>({})
const notes = ref<Record<number, string>>({})
const corrections = ref<Record<number, string>>({})
const openedAt = Date.now()
/** Which document is on screen. A dossier can carry several. */
const shown = ref(0)

onBeforeMount(async () => {
  try {
    data.value = await api.dataops.dossier(Number(route.params.id))
  } catch (e) {
    error.value = describeFailure(e, 'Dit dossier kon niet worden geladen.')
  } finally {
    loading.value = false
  }
})

/** Dutch labels for the fields the pipeline can fill. */
const FIELD_LABEL: Record<string, string> = {
  funderingstype: 'Funderingstype',
  bouwjaar: 'Bouwjaar',
  funderingskwaliteit: 'Funderingskwaliteit',
  herstel_geadviseerd: 'Herstel geadviseerd',
  handhavingstermijn: 'Handhavingstermijn',
  grondwaterstand: 'Grondwaterstand',
}

const open = computed(() => (data.value?.fields ?? []).filter((f) => !decided.value[f.id]))
const settled = computed(() => (data.value?.fields ?? []).filter((f) => decided.value[f.id]))

/** The model reasoned rather than read. Said plainly, not hidden. */
const isInferred = (f: IProposedField) => /^\s*afgeleid\s*:/i.test(f.evidence ?? '')
/** The source was not allowed to establish this field — a QuickScan quoting us back. */
const isRefused = (f: IProposedField) => f.state === 'rejected'

const metaLine = computed(() => {
  const d = data.value?.dossier
  if (!d) return ''
  const when = new Date(d.receivedAt).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return [d.externalRef ?? 'zonder kenmerk', `via ${d.channel}`, `ontvangen ${when}`].join(' · ')
})

const artifacts = computed(() => data.value?.artifacts ?? [])
const current = computed(() => artifacts.value[shown.value] ?? null)
const isImage = (mime: string | null) => !!mime && mime.startsWith('image/')

/**
 * Which document a value came from. Selecting a value shows its document, so a
 * reviewer never has to work out which of four attachments is being quoted.
 */
function focus(f: IProposedField) {
  const i = artifacts.value.findIndex((a) => a.id === f.artifactId)
  if (i >= 0) shown.value = i
}

/** Signed links expire; opening in a new tab keeps the review screen intact. */
function openArtifact(link: string) {
  window.open(link, '_blank', 'noopener')
}

async function decide(f: IProposedField, outcome: VerdictOutcome) {
  busy.value = f.id
  try {
    await api.dataops.verdict({
      fieldId: f.id,
      outcome,
      finalValue: outcome === 'corrected' ? (corrections.value[f.id] ?? null) : null,
      note: notes.value[f.id]?.trim() || null,
      reviewSeconds: Math.round((Date.now() - openedAt) / 1000),
    })
    decided.value = { ...decided.value, [f.id]: outcome }
    // Move to the next open value's document straight away: the reviewer's
    // next decision is almost always about a different page.
    const next = open.value.find((o) => o.id !== f.id)
    if (next) focus(next)
  } catch (e) {
    error.value = describeFailure(e, 'Het oordeel kon niet worden opgeslagen.')
  } finally {
    busy.value = null
  }
}
</script>

<template>
  <AppShell :crumb="data?.dossier.subject ?? 'Controle'" fill>
    <!-- One header, then two columns that fill the rest of the screen: the
         document on the left, the values on the right. Judging a citation means
         looking at the page it came from, so the page is never a click away. -->
    <header
      v-if="data"
      class="flex shrink-0 items-center gap-3 border-b border-line bg-surface px-6 py-2.5"
    >
      <h1 class="text-lg min-w-0 truncate font-bold text-ink">
        {{ data.dossier.subject ?? 'Dossier' }}
      </h1>
      <Pill :label="`${open.length} te beoordelen`" tone="blue" plain />
      <p class="text-sm min-w-0 flex-1 truncate font-mono text-faint">{{ metaLine }}</p>
      <Button label="Terug naar de lijst" @click="router.push({ name: 'review-queue' })" />
    </header>

    <div
      v-if="error"
      class="text-md shrink-0 border-b border-red bg-red-tint px-6 py-2.5 text-red"
    >
      {{ error }}
    </div>

    <div class="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_var(--spacing-inspector)]">
      <!-- ------------------------------------------------------- document -->
      <section class="flex min-w-0 flex-col border-r border-line bg-sunken">
        <!-- Tabs only when there is something to choose between. -->
        <div
          v-if="artifacts.length > 1"
          class="flex shrink-0 items-center gap-1.5 border-b border-line bg-surface px-4 pt-2.5"
        >
          <button
            v-for="(a, i) in artifacts"
            :key="a.id"
            type="button"
            class="text-md max-w-[220px] truncate border-b-2 px-3 pt-1.5 pb-2.5"
            :class="
              i === shown
                ? 'border-green font-bold text-ink'
                : 'border-transparent font-medium text-subtle hover:text-strong'
            "
            @click="shown = i"
          >
            {{ a.originalFilename ?? `Document ${i + 1}` }}
          </button>
        </div>

        <div class="min-h-0 flex-1">
          <img
            v-if="current && isImage(current.mimeType)"
            :src="current.accessLink"
            :alt="current.originalFilename ?? 'Brondocument'"
            class="h-full w-full object-contain"
          />
          <iframe
            v-else-if="current"
            :src="current.accessLink"
            class="h-full w-full border-0"
            :title="current.originalFilename ?? 'Brondocument'"
          />
          <EmptyState v-else>Geen document bij dit dossier.</EmptyState>
        </div>

        <div
          v-if="current"
          class="text-sm flex shrink-0 items-center gap-3 border-t border-line bg-surface px-4 py-2 text-faint"
        >
          <span class="min-w-0 flex-1 truncate font-mono">{{ current.originalFilename }}</span>
          <span>{{ current.pageCount }} pag.</span>
          <span>{{ current.lane === 'text' ? 'tekst' : 'afbeelding' }}</span>
          <span v-if="data?.fields[0]" class="font-mono">{{ data.fields[0].model }}</span>
          <button
            type="button"
            class="font-medium text-blue-ink underline-offset-2 hover:underline"
            @click="openArtifact(current.accessLink)"
          >
            Nieuw tabblad
          </button>
        </div>
      </section>

      <!-- --------------------------------------------------------- values -->
      <aside class="flex min-h-0 flex-col overflow-y-auto bg-surface">
        <div class="flex flex-col gap-3 p-4">
          <EmptyState v-if="loading">Dossier ophalen…</EmptyState>

          <Callout v-else-if="open.length === 0" tone="green" title="Alles beoordeeld">
            Er staan geen voorstellen meer open op dit dossier.
          </Callout>

          <Panel
            v-for="f in open"
            :key="f.id"
            :caption="(FIELD_LABEL[f.field] ?? f.field).toUpperCase()"
            :meta="f.confidence ?? undefined"
          >
            <div class="flex flex-col gap-3" @focusin="focus(f)" @click="focus(f)">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-2xl font-display font-bold text-ink">{{ f.value ?? '—' }}</span>
                <Pill v-if="isRefused(f)" label="bron niet toelaatbaar" tone="red" />
                <Pill v-else-if="isInferred(f)" label="afgeleid" tone="amber" />
                <Pill v-else-if="f.state === 'auto_accepted'" label="hoge zekerheid" tone="green" />
              </div>

              <!-- The citation is what is being judged, not the value. -->
              <p class="text-md border-l-2 border-line-strong pl-3 text-muted">
                {{ f.evidence ?? 'Geen citaat meegegeven.' }}
              </p>

              <Callout
                v-if="isRefused(f)"
                tone="red"
                title="Dit document mag dit veld niet vaststellen"
              >
                Een QuickScan of funderingsrisicorapport toont FunderMaps-gegevens.
              </Callout>

              <Field
                v-if="f.field === 'funderingstype'"
                v-model="corrections[f.id]"
                kind="select"
                label="Andere waarde"
                :options="FOUNDATION_TYPE_OPTIONS"
              />
              <Field v-else v-model="corrections[f.id]" label="Andere waarde" />

              <Field
                v-model="notes[f.id]"
                kind="textarea"
                :rows="2"
                label="Toelichting"
                hint="Waarom klopt het niet? Dit stuurt de volgende versie."
              />

              <div class="flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  label="Overnemen"
                  :disabled="busy === f.id || isRefused(f)"
                  @click="decide(f, 'confirmed')"
                />
                <Button
                  label="Aanpassen"
                  :disabled="busy === f.id || !corrections[f.id]"
                  @click="decide(f, 'corrected')"
                />
                <Button
                  variant="danger"
                  label="Afkeuren"
                  :disabled="busy === f.id"
                  @click="decide(f, 'rejected')"
                />
              </div>
            </div>
          </Panel>

          <Panel v-if="settled.length" caption="BEOORDEELD" :meta="String(settled.length)">
            <ul class="flex flex-col gap-2">
              <li
                v-for="f in settled"
                :key="f.id"
                class="text-md flex gap-2.5 border-b border-canvas pb-2 last:border-b-0 last:pb-0"
              >
                <span aria-hidden="true" class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green" />
                <span class="min-w-0">
                  <span class="block font-semibold text-body">
                    {{ FIELD_LABEL[f.field] ?? f.field }} — {{ f.value }}
                  </span>
                  <span class="block text-muted">{{ decided[f.id] }}</span>
                </span>
              </li>
            </ul>
          </Panel>
        </div>
      </aside>
    </div>
  </AppShell>
</template>
