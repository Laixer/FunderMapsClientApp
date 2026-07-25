<script setup lang="ts">
import { computed } from 'vue'

import Icon from '@/components/Common/Icon.vue'
import type { IconName } from '@/components/Common/icons'
import PipelineTrail from '@/components/Common/PipelineTrail.vue'
import {
  eventMeta,
  nextStep,
  reopenedFrom,
  ROLE_LABELS,
  statusLabelFor,
  type DossierEvent,
  type NextStepTone,
} from '@/services/pipeline'
import { formatDate, formatDateTime } from '@/utils/date'

/**
 * The journey panel: where a dossier stands, whose turn it is, what happened
 * along the way, and the milestones we can vouch for.
 *
 * Deliberately absent: "laatst gewijzigd". `update_date` was bulk-stamped by two
 * migrations and is wrong for most rows — see the note in `services/pipeline.ts`.
 * A blank is better than a confident lie about who last touched a dossier.
 */
const props = defineProps<{
  status: number | null | undefined
  createDate: string | null | undefined
  documentDate?: string | null
  creatorName?: string | null
  reviewerName?: string | null
  /**
   * The dossier's trail, oldest first. Empty is the normal case for anything
   * that predates `report.dossier_event`, and also what a caller passes when
   * the request failed — so the section simply does not render.
   */
  events?: DossierEvent[]
}>()

const trail = computed(() => props.events ?? [])

/**
 * `created` is the one event every dossier has, courtesy of the backfill, and it
 * says exactly what the "Aangemaakt" row says. Drop the row when the trail is
 * carrying it.
 */
const hasCreatedEvent = computed(() => trail.value.some((e) => e.kind === 'created'))

const step = computed(() => nextStep(props.status))

const TONE_CLASSES: Record<NextStepTone, string> = {
  neutral: 'border-grey-200 bg-grey-100 text-grey-800',
  attention: 'border-yellow-500 bg-yellow-100 text-grey-800',
  critical: 'border-red-200 bg-red-50 text-red-800',
  positive: 'border-green-200 bg-green-100 text-green-800',
}

const TONE_ICONS: Record<NextStepTone, IconName> = {
  neutral: 'clipboard',
  attention: 'bell',
  critical: 'alert',
  positive: 'check',
}

const people = computed(() => ({
  creator: props.creatorName ?? null,
  reviewer: props.reviewerName ?? null,
}))

/** Whose turn it is, named — the panel's single most-read line. */
const actor = computed(() => {
  const role = step.value.role
  if (!role) return null
  const name =
    role === 'reviewer' ? props.reviewerName : role === 'creator' ? props.creatorName : null
  return { label: ROLE_LABELS[role], name: name ?? null }
})
</script>

<template>
  <section class="border-grey-200 rounded-md border bg-white p-5">
    <h4 class="text-grey-700 mb-5 text-xs font-semibold tracking-wide uppercase">Voortgang</h4>

    <PipelineTrail :status="status" :people="people" />

    <div class="mt-6 flex items-start gap-3 rounded-md border p-3" :class="TONE_CLASSES[step.tone]">
      <Icon :name="TONE_ICONS[step.tone]" size="md" class="mt-0.5" />
      <div class="min-w-0">
        <p class="text-sm font-semibold">
          {{ step.title }}
          <span v-if="actor" class="font-normal">
            —
            <template v-if="actor.name">{{ actor.name }}</template>
            <template v-else>{{ actor.label.toLowerCase() }} (niet toegewezen)</template>
          </span>
        </p>
        <p class="mt-0.5 text-sm opacity-90">{{ step.detail }}</p>
      </div>
    </div>

    <!-- What actually happened, oldest first. Absent for dossiers older than
         report.dossier_event, and when the request failed — better a panel
         without a trail than a panel claiming an empty history. -->
    <ol v-if="trail.length" class="mt-6 space-y-3">
      <li v-for="(event, i) in trail" :key="`${event.kind}-${event.date}-${i}`" class="flex gap-3">
        <!-- The connector stops at the last entry: a line trailing into nothing
             would imply a step we know about and are not showing. -->
        <div class="relative flex w-4 shrink-0 justify-center">
          <span
            v-if="i < trail.length - 1"
            aria-hidden="true"
            class="bg-grey-200 absolute top-5 bottom-[-0.75rem] w-px"
          />
          <Icon
            :name="eventMeta(event.kind).icon"
            size="xs"
            class="bg-white"
            :class="eventMeta(event.kind).tone"
          />
        </div>
        <div class="min-w-0 flex-1 pb-0.5">
          <p class="text-sm">
            <span class="text-grey-800 font-medium">{{ eventMeta(event.kind).label }}</span>
            <span v-if="reopenedFrom(event)" class="text-grey-700">
              uit “{{ statusLabelFor(reopenedFrom(event)!) }}”
            </span>
            <span class="text-grey-700">
              · {{ formatDateTime(event.date) }}
              <template v-if="event.actorName">· {{ event.actorName }}</template>
            </span>
          </p>
          <!-- A rejection motivation. Until now this lived only in an email. -->
          <p
            v-if="event.note"
            class="border-grey-200 text-grey-800 mt-1 border-l-2 pl-2 text-sm whitespace-pre-wrap"
          >
            {{ event.note }}
          </p>
        </div>
      </li>
    </ol>

    <dl class="mt-5 grid grid-cols-[9rem_1fr] gap-x-4 gap-y-2 text-sm">
      <template v-if="!hasCreatedEvent">
        <dt class="text-grey-700">Aangemaakt</dt>
        <dd class="text-grey-800">
          {{ formatDate(createDate) }}
          <span v-if="creatorName" class="text-grey-700">· {{ creatorName }}</span>
        </dd>
      </template>

      <template v-if="documentDate">
        <dt class="text-grey-700">Documentdatum</dt>
        <dd class="text-grey-800">{{ formatDate(documentDate) }}</dd>
      </template>

      <!-- Domain-specific rows: how complete the entry is, how many addresses,
           anything the caller can count. Same dt/dd grid. -->
      <slot name="facts" />
    </dl>
  </section>
</template>
