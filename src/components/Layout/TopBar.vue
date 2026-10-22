<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'

import { crumbTrail } from '@/services/navigation'
import { useStudioStore } from '@/stores/studio'

/**
 * A 54px translucent strip that says where you are: the part of the studio
 * (Inzicht, Gegevens, Werk), the place that owns the page as a link back, and
 * the page itself — "Gegevens / Rapportages / Archiefonderzoek …".
 *
 * No global button any more (2026-10-22): "Nieuwe rapportage" was the loudest
 * thing on every screen of a studio where agents do the entry. Making a record
 * by hand lives in the Rapportages and Herstel headers, Ctrl+K and `g n`.
 * Everything a page can do lives in that page's own header, next to the thing
 * it acts on.
 *
 * Translucent with a blur because the content scrolls under it, and a solid bar
 * over a scrolling table reads as a seam.
 */
defineProps<{ crumb: string }>()

const route = useRoute()
const trail = computed(() => crumbTrail(String(route.name ?? '')))

/*
 * The studio's pulse, on the right of every page but Vandaag (which draws it in
 * full): the model's last run today, the reader, and what waits for a person.
 * Most of the work is the machines' now; this is where you see they are at it
 * without leaving the page you are on (2026-10-22). Nothing until it is known.
 */
const { pulse } = storeToRefs(useStudioStore())
const nl = (n: number) => n.toLocaleString('nl-NL')
const clock = (iso: string) =>
  new Date(iso).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' })
const beat = computed(() => {
  const p = pulse.value
  if (!p || route.name === 'home') return null
  const runs = p.today.modelRuns.filter((r) => r.job === 'refresh_data_model')
  const run = runs[runs.length - 1]
  return {
    model: run
      ? { text: `model ${run.status === 'ok' ? 'bijgewerkt' : 'mislukt'} ${clock(run.finishedAt)}`, dot: run.status === 'ok' ? 'bg-green' : 'bg-red' }
      : { text: 'model vandaag nog niet gedraaid', dot: 'bg-line-hover' },
    reader: `lezer ${nl(p.today.reader?.documents ?? 0)} gelezen${p.waiting?.toRead ? `, ${nl(p.waiting.toRead)} te lezen` : ''}`,
    toJudge: p.waiting?.toJudge ?? null,
  }
})
</script>

<template>
  <header
    class="sticky top-0 z-5 flex h-topbar shrink-0 items-center gap-3.5 border-b border-line bg-white/85 px-6 backdrop-blur-md"
  >
    <nav class="text-md flex min-w-0 items-center gap-2 text-faint" aria-label="Kruimelpad">
      <template v-for="step in trail" :key="step.label">
        <RouterLink v-if="step.route" :to="{ name: step.route }" class="shrink-0 hover:text-strong hover:underline">{{ step.label }}</RouterLink>
        <span v-else class="shrink-0">{{ step.label }}</span>
        <span aria-hidden="true">/</span>
      </template>
      <span class="truncate font-semibold text-strong" aria-current="page">{{ crumb }}</span>
    </nav>

    <RouterLink
      v-if="beat"
      :to="{ name: 'home' }"
      class="text-sm ml-auto flex shrink-0 items-center gap-2 rounded-lg px-2 py-1 text-muted hover:bg-sunken hover:text-strong"
      aria-label="De dag van de studio (Vandaag)"
      title="De dag van de studio: Vandaag"
    >
      <span class="h-2 w-2 rounded-full" :class="beat.model.dot" aria-hidden="true" />
      <span>{{ beat.model.text }}</span>
      <span class="text-faint" aria-hidden="true">·</span>
      <span>{{ beat.reader }}</span>
      <template v-if="beat.toJudge != null">
        <span class="text-faint" aria-hidden="true">·</span>
        <span><span class="font-mono text-strong">{{ nl(beat.toJudge) }}</span> te beoordelen</span>
      </template>
    </RouterLink>
  </header>
</template>
