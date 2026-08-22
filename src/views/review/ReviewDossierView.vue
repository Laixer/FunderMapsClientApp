<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppShell from '@/components/Layout/AppShell.vue'
import Button from '@/components/Common/Buttons/Button.vue'
import EmptyState from '@/components/Common/EmptyState.vue'
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
 * The screen puts three things side by side, because a value on its own cannot
 * be judged: what the model proposes, the passage it read that from, and the
 * document itself. If the citation matches the page, the answer is sound.
 *
 * Decisions are per field. A document routinely yields six values where five
 * are solid and one is a stretch, and a single verdict for the whole document
 * would either discard the good ones or wave the bad one through.
 */
const route = useRoute()
const router = useRouter()

const data = ref<IReviewDossier | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const busy = ref<number | null>(null)
const done = ref<Record<number, VerdictOutcome>>({})
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

const open = computed(() => (data.value?.fields ?? []).filter((f) => !done.value[f.id]))
const artifactFor = (f: IProposedField) =>
  data.value?.artifacts.find((a) => a.id === f.artifactId) ?? null

/** The model reasoned rather than read. Worth saying plainly, not hiding. */
const isInferred = (f: IProposedField) => /^\s*afgeleid\s*:/i.test(f.evidence ?? '')
/** The source was not allowed to establish this field — a QuickScan quoting us. */
const isRefused = (f: IProposedField) => f.state === 'rejected'

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
    done.value = { ...done.value, [f.id]: outcome }
  } catch (e) {
    error.value = describeFailure(e, 'Het oordeel kon niet worden opgeslagen.')
  } finally {
    busy.value = null
  }
}
</script>

<template>
  <AppShell crumb="Controle">
    <EmptyState v-if="loading" dashed>Bezig met laden…</EmptyState>
    <EmptyState v-else-if="error" dashed>{{ error }}</EmptyState>

    <div v-else-if="data" class="flex flex-col gap-4">
      <header class="flex items-baseline justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold">{{ data.dossier.subject ?? 'Dossier' }}</h1>
          <p class="text-md text-muted">
            Kenmerk {{ data.dossier.externalRef ?? '—' }} ·
            binnengekomen via {{ data.dossier.channel }}
          </p>
        </div>
        <Button variant="ghost" @click="router.push({ name: 'review-queue' })">
          Terug naar de lijst
        </Button>
      </header>

      <EmptyState v-if="open.length === 0" dashed>
        Alles op dit dossier is beoordeeld.
      </EmptyState>

      <Panel v-for="f in open" :key="f.id" :caption="FIELD_LABEL[f.field] ?? f.field">
        <div class="flex flex-col gap-3 md:flex-row">
          <!-- the document, so the citation can be checked against it -->
          <a
            v-if="artifactFor(f)"
            :href="artifactFor(f)!.accessLink"
            target="_blank"
            rel="noopener"
            class="shrink-0 text-md font-medium text-accent underline-offset-2 hover:underline"
          >
            Open origineel →
            <span class="block text-sm text-muted">
              {{ artifactFor(f)!.originalFilename }}
              ({{ artifactFor(f)!.pageCount }} pag., {{ artifactFor(f)!.lane }})
            </span>
          </a>

          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-baseline gap-3">
              <span class="text-lg font-semibold">{{ f.value ?? '—' }}</span>
              <span class="font-mono text-md tabular-nums text-muted">{{ f.confidence }}</span>
              <Pill v-if="isRefused(f)" label="bron niet toelaatbaar" tone="red" />
              <Pill v-else-if="isInferred(f)" label="afgeleid" tone="amber" />
              <Pill v-else-if="f.state === 'auto_accepted'" label="hoge zekerheid" tone="green" />
            </div>

            <blockquote class="mt-2 border-l-2 border-line-strong pl-3 text-md text-muted">
              {{ f.evidence ?? 'Geen citaat meegegeven.' }}
            </blockquote>

            <div class="mt-3 flex flex-wrap items-center gap-2">
              <Button
                :disabled="busy === f.id || isRefused(f)"
                @click="decide(f, 'confirmed')"
              >
                Overnemen
              </Button>

              <select
                v-if="f.field === 'funderingstype'"
                v-model="corrections[f.id]"
                class="rounded-md border border-line-strong bg-raised px-2 py-1.5 text-md"
              >
                <option value="">Aanpassen naar…</option>
                <option v-for="o in FOUNDATION_TYPE_OPTIONS" :key="String(o.value)" :value="o.label">
                  {{ o.label }}
                </option>
              </select>
              <input
                v-else
                v-model="corrections[f.id]"
                placeholder="Aanpassen naar…"
                class="rounded-md border border-line-strong bg-raised px-2 py-1.5 text-md"
              />

              <Button
                variant="secondary"
                :disabled="busy === f.id || !corrections[f.id]"
                @click="decide(f, 'corrected')"
              >
                Aanpassen
              </Button>
              <Button
                variant="ghost"
                :disabled="busy === f.id"
                @click="decide(f, 'rejected')"
              >
                Afkeuren
              </Button>
            </div>

            <!--
              The reason matters more than the tally. Every improvement to this
              pipeline so far came from someone explaining why a value was
              wrong, not from the score moving.
            -->
            <input
              v-model="notes[f.id]"
              placeholder="Waarom? (bij afkeuren of aanpassen — dit stuurt de volgende versie)"
              class="mt-2 w-full rounded-md border border-line-strong bg-raised px-2 py-1.5 text-md"
            />
          </div>
        </div>
      </Panel>
    </div>
  </AppShell>
</template>
