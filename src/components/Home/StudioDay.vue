<script setup lang="ts">
import { computed } from 'vue'

import Panel from '@/components/Common/Panel.vue'
import Sparkline from '@/components/Common/Sparkline.vue'
import type { IStudioToday } from '@/services/fundermaps/interfaces/IDataops'
import { sourceLabel } from '@/services/dataflow'
import type { Tone } from '@/services/tone'

/**
 * "Vandaag in de studio" (2026-10-22): the day as the pipeline lived it, left
 * to right — what came in, what the reader read, what people judged, what went
 * into FunderMaps, and the model's runs — each with its two weeks as a
 * sparkline, today the last bar. On the right what waits for a person.
 *
 * Most of the work is done by the machines; this is where you see that they
 * did it, and where they are waiting on us.
 */
const props = defineProps<{ data: IStudioToday }>()

const nl = (n: number) => n.toLocaleString('nl-NL')
// Amsterdam's clock, like the day itself and the run slots: the same on a laptop abroad.
const time = (iso: string) =>
  new Date(iso).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' })
/** 160 → "2:40". */
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`
const plural = (n: number, one: string, many: string) => `${nl(n)} ${n === 1 ? one : many}`

const t = computed(() => props.data.today)

interface Stage {
  key: string
  label: string
  n: number
  lines: { text: string; tone?: Tone }[]
  series: number[]
  tone: Tone
}

const stages = computed<Stage[]>(() => {
  const r = t.value.reader
  const j = t.value.judged
  const o = j.byOutcome
  const channels = t.value.received.byChannel
  return [
    {
      key: 'received',
      label: 'Binnen',
      n: t.value.received.total,
      lines: channels.length
        ? [{ text: channels.map((c) => `${nl(c.n)} ${sourceLabel(c.channel)}`).join(' · ') }]
        : [{ text: 'nog niets binnen' }],
      series: props.data.series.received,
      tone: 'blue',
    },
    {
      key: 'read',
      label: 'Gelezen',
      n: r?.documents ?? 0,
      lines: [
        { text: `door de lezer: ${plural(r?.documents ?? 0, 'document', 'documenten')}, ${plural(r?.proposed ?? 0, 'waarde', 'waarden')} voorgesteld` },
        ...(r?.errors ? [{ text: `${plural(r.errors, 'keer', 'keer')} mislukt`, tone: 'red' as Tone }] : []),
      ],
      series: props.data.series.read,
      tone: 'blue',
    },
    {
      key: 'judged',
      label: 'Beoordeeld',
      n: j.total,
      lines: j.total
        ? [
            {
              text: [
                o.confirmed ? `${nl(o.confirmed)} overgenomen` : null,
                o.corrected ? `${nl(o.corrected)} verbeterd` : null,
                o.rejected ? `${nl(o.rejected)} afgewezen` : null,
              ]
                .filter(Boolean)
                .join(' · '),
            },
            {
              text: [
                j.medianSeconds != null ? `${mmss(j.medianSeconds)} per waarde` : null,
                plural(j.people, 'persoon', 'mensen'),
                j.mine ? `${nl(j.mine)} door jou` : null,
              ]
                .filter(Boolean)
                .join(' · '),
            },
          ]
        : [{ text: 'nog niets beoordeeld' }],
      series: props.data.series.judged,
      tone: 'green',
    },
    {
      key: 'committed',
      label: 'In FunderMaps',
      n: t.value.committed,
      lines: [{ text: `${plural(t.value.committed, 'rapportage', 'rapportages')}; ${nl(t.value.closed)} gesloten zonder` }],
      series: props.data.series.committed,
      tone: 'green',
    },
  ]
})

/** The model's two daily runs, 12:30 and 21:00 (Amsterdam), as on Modellen; and when the map was last exported. */
const runs = computed(() => {
  const refresh = t.value.modelRuns.filter((r) => r.job === 'refresh_data_model')
  const hour = (iso: string) => Number(new Date(iso).toLocaleString('nl-NL', { hour: '2-digit', hour12: false, timeZone: 'Europe/Amsterdam' }))
  const now = Number(new Date().toLocaleString('nl-NL', { hour: '2-digit', hour12: false, timeZone: 'Europe/Amsterdam' }))
  // `late`: the hour after which a run that has not finished counts as not run (12:30 usually ends ~13:40).
  return [
    { slot: '12:30', from: 12, to: 21, late: 15 },
    { slot: '21:00', from: 21, to: 24, late: 23 },
  ].map((s) => {
    const run = refresh.find((r) => hour(r.finishedAt) >= s.from && hour(r.finishedAt) < s.to)
    const state = run ? (run.status === 'ok' ? 'ok' : 'failed') : now >= s.late ? 'missing' : 'upcoming'
    return { ...s, run, state }
  })
})
const lastExport = computed(() => {
  const ok = t.value.modelRuns.filter((r) => r.job === 'export_tileset' && r.status === 'ok')
  return ok[ok.length - 1] ?? null
})
const RUN_DOT: Record<string, string> = {
  ok: 'bg-green-ink border-green-ink',
  failed: 'bg-red-ink border-red-ink',
  missing: 'bg-surface border-red-ink',
  upcoming: 'bg-surface border-line-hover border-dashed',
}
const RUN_WORD: Record<string, string> = { ok: 'gelukt', failed: 'mislukt', missing: 'niet gedraaid', upcoming: 'nog niet aan de beurt' }

const STAGE_DOT: Record<Tone, string> = { green: 'bg-green', blue: 'bg-blue', amber: 'bg-amber', red: 'bg-red', neutral: 'bg-line-hover' }
const LINE_TEXT: Record<Tone, string> = { green: 'text-green-ink', blue: 'text-blue-ink', amber: 'text-amber-ink', red: 'text-red', neutral: 'text-muted' }
</script>

<template>
  <Panel title="Vandaag in de studio" :meta="`bijgewerkt ${time(data.generatedAt)}`">
    <template #actions>
      <span class="text-sm text-faint">de balkjes: de laatste 14 dagen, vandaag rechts</span>
    </template>
    <div class="grid grid-cols-[repeat(5,minmax(0,1fr))_minmax(0,1.15fr)] items-stretch" role="list" aria-label="De dag van de studio">
      <!-- The four stages, joined by the line the chains use elsewhere in the Studio. -->
      <div
        v-for="(s, i) in stages"
        :key="s.key"
        role="listitem"
        :aria-label="`${s.label}: ${s.n}`"
        class="flex min-w-0 flex-col gap-1 pr-4"
        :class="i ? 'pl-4' : ''"
      >
        <p class="flex items-center gap-2">
          <span class="h-2 w-2 shrink-0 rounded-full" :class="STAGE_DOT[s.tone]" />
          <span class="studio-label truncate">{{ s.label }}</span>
          <span class="h-px flex-1 bg-line" aria-hidden="true" />
        </p>
        <p class="text-4xl font-display font-bold tabular-nums" :class="s.n ? 'text-ink' : 'text-ghost'">{{ nl(s.n) }}</p>
        <p v-for="(l, k) in s.lines" :key="k" class="text-sm leading-snug" :class="LINE_TEXT[l.tone ?? 'neutral']">{{ l.text }}</p>
        <div class="mt-auto pt-2" :title="`Per dag, ${data.days[0]} tot vandaag: ${s.series.join(' · ')}`">
          <Sparkline :values="s.series" :tone="s.tone" />
        </div>
      </div>

      <!-- The model -->
      <div role="listitem" aria-label="Het model" class="flex min-w-0 flex-col gap-1 pr-4 pl-4">
        <p class="flex items-center gap-2">
          <span class="h-2 w-2 shrink-0 rounded-full bg-ink" />
          <span class="studio-label">Het model</span>
          <span class="h-px flex-1 bg-line" aria-hidden="true" />
        </p>
        <div class="flex flex-col gap-1.5 pt-1.5">
          <p v-for="r in runs" :key="r.slot" class="text-md flex items-center gap-2" :title="RUN_WORD[r.state]">
            <span class="h-3 w-3 shrink-0 rounded-full border-2" :class="RUN_DOT[r.state]" />
            <span class="font-mono text-strong">{{ r.slot }}</span>
            <span class="text-sm" :class="r.state === 'ok' ? 'text-muted' : r.state === 'upcoming' ? 'text-faint' : 'text-red'">
              {{ r.run ? `${RUN_WORD[r.state]}, klaar ${time(r.run.finishedAt)}` : RUN_WORD[r.state] }}
            </span>
          </p>
        </div>
        <p class="text-sm mt-1 text-muted">
          <template v-if="lastExport">kaart bijgewerkt {{ time(lastExport.finishedAt) }}</template>
          <template v-else>kaart vandaag nog niet bijgewerkt</template>
        </p>
        <RouterLink :to="{ name: 'models' }" class="text-sm mt-auto pt-2 text-blue-ink hover:underline">Modellen →</RouterLink>
      </div>

      <!-- What waits for a person -->
      <div v-if="data.waiting" class="flex flex-col gap-2 rounded-xl border border-amber-border bg-amber-wash px-4 py-3">
        <p class="studio-label text-amber-ink">Wacht op een mens</p>
        <RouterLink :to="{ name: 'review-queue', query: { view: 'alles' } }" class="group flex items-baseline gap-2">
          <span class="text-2xl font-display font-bold text-ink tabular-nums">{{ nl(data.waiting.toJudge) }}</span>
          <span class="text-sm text-body group-hover:underline">waarden te beoordelen</span>
        </RouterLink>
        <RouterLink :to="{ name: 'dataflow' }" class="group flex items-baseline gap-2">
          <span class="text-lg font-display font-bold text-ink tabular-nums">{{ nl(data.waiting.openDossiers) }}</span>
          <span class="text-sm text-body group-hover:underline">dossiers open</span>
        </RouterLink>
        <p class="flex items-baseline gap-2" :title="'Documenten in open dossiers die de lezer nog niet las'">
          <span class="text-lg font-display font-bold tabular-nums" :class="data.waiting.toRead ? 'text-ink' : 'text-ghost'">{{ nl(data.waiting.toRead) }}</span>
          <span class="text-sm text-body">{{ data.waiting.toRead === 1 ? 'document' : 'documenten' }} nog niet gelezen</span>
        </p>
      </div>
    </div>
  </Panel>
</template>
