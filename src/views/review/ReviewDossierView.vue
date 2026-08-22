<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppShell from '@/components/Layout/AppShell.vue'
import Button from '@/components/Common/Buttons/Button.vue'
import Callout from '@/components/Common/Callout.vue'
import EmptyState from '@/components/Common/EmptyState.vue'
import Field from '@/components/Common/Field.vue'
import KeyValueList, { type KeyValueItem } from '@/components/Common/KeyValueList.vue'
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

const documentDetails = computed<KeyValueItem[]>(() =>
  (data.value?.artifacts ?? []).flatMap((a) => [
    { label: 'Bestand', value: a.originalFilename ?? a.storageKey },
    { label: "Pagina's", value: a.pageCount != null ? String(a.pageCount) : '—' },
    { label: 'Gelezen als', value: a.lane === 'text' ? 'tekst' : 'afbeelding' },
  ]),
)

const provenance = computed<KeyValueItem[]>(() => {
  const f = data.value?.fields[0]
  return f ? [
    { label: 'Model', value: f.model },
    { label: 'Prompt', value: f.promptVersion },
  ] : []
})

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
  } catch (e) {
    error.value = describeFailure(e, 'Het oordeel kon niet worden opgeslagen.')
  } finally {
    busy.value = null
  }
}
</script>

<template>
  <AppShell :crumb="data?.dossier.subject ?? 'Controle'">
    <div
      class="grid grid-cols-[minmax(0,1fr)_var(--spacing-aside)] items-start gap-4.5 px-6 py-6"
    >
      <div class="flex min-w-0 flex-col gap-4">
        <header v-if="data" class="flex items-start gap-3.5">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2.5">
              <h1 class="text-4xl font-display font-bold break-words text-ink">
                {{ data.dossier.subject ?? 'Dossier' }}
              </h1>
              <Pill :label="`${open.length} te beoordelen`" tone="blue" />
            </div>
            <p class="text-sm mt-1 font-mono text-faint">{{ metaLine }}</p>
          </div>
          <div class="ml-auto flex shrink-0 gap-2">
            <Button label="Terug naar de lijst" @click="router.push({ name: 'review-queue' })" />
          </div>
        </header>

        <Panel v-if="loading" caption="VOORSTELLEN">
          <EmptyState>Dossier ophalen…</EmptyState>
        </Panel>

        <Callout v-else-if="error" tone="red" title="Er ging iets mis">
          {{ error }}
        </Callout>

        <template v-else-if="data">
          <Callout
            v-if="open.length === 0"
            tone="green"
            title="Alles beoordeeld"
          >
            Er staan geen voorstellen meer open op dit dossier.
          </Callout>

          <Panel
            v-for="f in open"
            :key="f.id"
            :caption="(FIELD_LABEL[f.field] ?? f.field).toUpperCase()"
            :meta="f.confidence ?? undefined"
          >
            <div class="flex flex-col gap-3.5">
              <div class="flex flex-wrap items-center gap-2.5">
                <span class="text-4xl font-display font-bold text-ink">{{ f.value ?? '—' }}</span>
                <Pill v-if="isRefused(f)" label="bron niet toelaatbaar" tone="red" />
                <Pill v-else-if="isInferred(f)" label="afgeleid" tone="amber" />
                <Pill
                  v-else-if="f.state === 'auto_accepted'"
                  label="hoge zekerheid"
                  tone="green"
                />
              </div>

              <!-- The citation is the thing being judged, not the value. -->
              <p class="text-md border-l-2 border-line-strong pl-3 text-muted">
                {{ f.evidence ?? 'Geen citaat meegegeven.' }}
              </p>

              <Callout
                v-if="isRefused(f)"
                tone="red"
                title="Dit document mag dit veld niet vaststellen"
              >
                Een QuickScan of funderingsrisicorapport toont FunderMaps-gegevens. Overnemen
                zou onze eigen uitkomst opnieuw invoeren.
              </Callout>

              <div class="grid grid-cols-2 items-start gap-4">
                <Field
                  v-if="f.field === 'funderingstype'"
                  v-model="corrections[f.id]"
                  kind="select"
                  label="Andere waarde"
                  :options="FOUNDATION_TYPE_OPTIONS"
                  hint="Alleen invullen als het voorstel niet klopt."
                />
                <Field
                  v-else
                  v-model="corrections[f.id]"
                  label="Andere waarde"
                  hint="Alleen invullen als het voorstel niet klopt."
                />
                <Field
                  v-model="notes[f.id]"
                  kind="textarea"
                  :rows="2"
                  label="Toelichting"
                  hint="Waarom klopt het niet? Dit stuurt de volgende versie van de pipeline."
                />
              </div>

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
        </template>
      </div>

      <aside class="sticky top-[calc(var(--spacing-topbar)+1.5rem)] flex flex-col gap-4">
        <Panel caption="DOCUMENT">
          <div class="flex flex-col gap-3">
            <KeyValueList v-if="documentDetails.length" :items="documentDetails" />
            <EmptyState v-else>Geen document.</EmptyState>
            <Button
              v-for="a in data?.artifacts ?? []"
              :key="a.id"
              label="Open origineel"
              block
              @click="openArtifact(a.accessLink)"
            />
          </div>
        </Panel>

        <Panel v-if="provenance.length" caption="GELEZEN DOOR">
          <KeyValueList :items="provenance" />
        </Panel>
      </aside>
    </div>
  </AppShell>
</template>
