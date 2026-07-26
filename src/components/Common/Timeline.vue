<script setup lang="ts">
import type { Tone } from '@/services/tone'
import { TONE_DOT } from '@/services/tone'

export interface TimelineEntry {
  id: string
  tone: Tone
  /** Bold lead-in — usually who did it. */
  who?: string | null
  /** What happened, in prose. */
  what: string
  /** Mono timestamp. */
  when: string
  /** Prose the event carried: a rejection motivation, an import source. */
  note?: string | null
}

/**
 * Who did what, and when.
 *
 * A connector runs between markers but stops at the last one — a line trailing
 * off the bottom would imply a step we know about and are not showing, and this
 * trail is often genuinely all there is (dossiers older than
 * `report.dossier_event` carry one backfilled entry and nothing else).
 */
defineProps<{ entries: TimelineEntry[] }>()
</script>

<template>
  <ol class="flex flex-col">
    <li v-for="(entry, i) in entries" :key="entry.id" class="grid grid-cols-[16px_minmax(0,1fr)] gap-2.5">
      <div class="flex flex-col items-center gap-1 pt-1.5">
        <span
          aria-hidden="true"
          class="h-[7px] w-[7px] shrink-0 rounded-full"
          :class="TONE_DOT[entry.tone]"
        />
        <span
          v-if="i < entries.length - 1"
          aria-hidden="true"
          class="w-px flex-1 bg-line"
        />
      </div>

      <div class="min-w-0 pb-3.5 last:pb-0">
        <p class="text-md text-body">
          <strong v-if="entry.who" class="font-bold">{{ entry.who }}</strong>
          {{ entry.what }}
        </p>
        <p class="text-xs mt-0.5 font-mono text-label">{{ entry.when }}</p>
        <!-- A rejection motivation. Until the trail existed this lived only in
             an email to the opsteller. -->
        <p
          v-if="entry.note"
          class="text-md mt-1.5 border-l-2 border-line pl-2 whitespace-pre-wrap text-body"
        >
          {{ entry.note }}
        </p>
      </div>
    </li>
  </ol>
</template>
