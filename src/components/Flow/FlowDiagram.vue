<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import type { IDataopsFlow } from '@/services/fundermaps/interfaces/IDataops'
import {
  buildFlow,
  layoutFlow,
  type FlowGroup,
  type PlacedLink,
  type PlacedNode,
} from '@/services/dataflow'

/**
 * Where every dossier went, as bands (services/dataflow.ts). One scale for
 * everything: a band is as thick as the dossiers it carries.
 *
 * Colour says only what became of it: green in FunderMaps, grey closed
 * without a rapportage, amber still open. Every node carries its name and
 * number, so nothing depends on telling the colours apart, and the table
 * under the picture says it all again in rows.
 *
 * Hover a band or node for its share; click it to open that slice in
 * Controle. The nodes are links for the keyboard too.
 */
const props = defineProps<{ data: IDataopsFlow }>()
const router = useRouter()

const WIDTH = 1000
const NODE = 10
const COLUMNS: [number, number, number] = [190, 500, 760]

const graph = computed(() => buildFlow(props.data))
const layout = computed(() =>
  layoutFlow(graph.value.nodes, graph.value.links, graph.value.total, {
    columns: COLUMNS,
    nodeWidth: NODE,
    span: 400,
    gap: 10,
    minSlot: 20,
    top: 30,
  }),
)
const height = computed(() => Math.ceil(layout.value.height + 14))

const FILL: Record<FlowGroup | 'source', string> = {
  done: 'fill-green-ink',
  closed: 'fill-label',
  open: 'fill-amber-ink',
  source: 'fill-strong',
}
const nodeFill = (n: PlacedNode) => FILL[n.group ?? 'source']

const nl = (n: number) => n.toLocaleString('nl-NL')
const pct = (part: number, whole: number) => (whole > 0 ? `${Math.round((part / whole) * 100)}%` : '—')

/* ---------------------------------------------------------------- hovering */

const hovered = ref<string | null>(null)
const tip = ref<{ x: number; y: number; title: string; line: string } | null>(null)
const box = ref<HTMLElement | null>(null)

const byId = computed(() => new Map(layout.value.nodes.map((n) => [n.id, n])))

function describeLink(l: PlacedLink) {
  const s = byId.value.get(l.source)!
  const t = byId.value.get(l.target)!
  return { title: `${s.label} → ${t.label}`, line: `${nl(l.value)} dossiers · ${pct(l.value, s.value)} van ${s.label.toLowerCase()}` }
}

function describeNode(n: PlacedNode) {
  return { title: n.label, line: `${nl(n.value)} dossiers · ${pct(n.value, graph.value.total)} van alles` }
}

function show(event: MouseEvent, id: string, text: { title: string; line: string }) {
  hovered.value = id
  const rect = box.value?.getBoundingClientRect()
  if (!rect) return
  tip.value = { x: event.clientX - rect.left, y: event.clientY - rect.top, ...text }
}

function hide() {
  hovered.value = null
  tip.value = null
}

/** A band lights up when it, or a node it touches, is under the pointer. */
const lit = (l: PlacedLink) => hovered.value === l.id || hovered.value === l.source || hovered.value === l.target

function go(target: { name: string; query?: Record<string, unknown> }) {
  router.push(target as Parameters<typeof router.push>[0])
}
</script>

<template>
  <div ref="box" class="relative" @mouseleave="hide">
    <svg
      :viewBox="`0 0 ${WIDTH} ${height}`"
      class="block h-auto w-full"
      role="img"
      :aria-label="`Waar ${nl(graph.total)} dossiers terechtkwamen, per bron`"
    >
      <!-- Bands first, so the nodes and their labels sit on top. -->
      <g>
        <path
          v-for="l in layout.links"
          :key="l.id"
          :d="l.path"
          :class="FILL[l.group]"
          :fill-opacity="lit(l) ? 0.55 : hovered ? 0.12 : 0.28"
          class="cursor-pointer transition-[fill-opacity] duration-150"
          @mousemove="show($event, l.id, describeLink(l))"
          @click="go(l.link)"
        />
      </g>

      <g
        v-for="n in layout.nodes"
        :key="n.id"
        role="link"
        tabindex="0"
        class="cursor-pointer outline-none [&:focus-visible>rect]:stroke-blue [&:focus-visible>rect]:stroke-2"
        :aria-label="`${n.label}: ${nl(n.value)} dossiers. Openen.`"
        @mousemove="show($event, n.id, describeNode(n))"
        @click="go(n.link)"
        @keydown.enter="go(n.link)"
      >
        <rect :x="n.x" :y="n.y" :width="NODE" :height="n.height" rx="2" :class="nodeFill(n)" />
        <!-- Left column: the name to the left of its node. The others: to the right,
             with a halo in the surface colour where it crosses a band. -->
        <text
          v-if="n.column === 0"
          :x="n.x - 10"
          :y="n.y + n.height / 2"
          text-anchor="end"
          dominant-baseline="central"
          class="text-[13px]"
        >
          <tspan class="fill-body font-semibold">{{ n.label }}</tspan>
          <tspan class="fill-muted font-mono text-[11.5px]" dx="8">{{ nl(n.value) }}</tspan>
        </text>
        <!-- The middle column's name and number on two lines: on one line the
             longest ran into the column beside it. -->
        <text
          v-else-if="n.column === 1"
          :x="n.x + NODE + 8"
          :y="n.y + n.height / 2"
          dominant-baseline="central"
          class="text-[13px] [paint-order:stroke] stroke-surface stroke-[4px] [stroke-linejoin:round]"
        >
          <tspan :x="n.x + NODE + 8" dy="-0.65em" class="fill-body font-bold">{{ n.label }}</tspan>
          <tspan :x="n.x + NODE + 8" dy="1.35em" class="fill-muted font-mono text-[11.5px]">
            {{ nl(n.value) }} · {{ pct(n.value, graph.total) }}
          </tspan>
        </text>
        <text
          v-else
          :x="n.x + NODE + 8"
          :y="n.y + n.height / 2"
          dominant-baseline="central"
          class="text-[13px] [paint-order:stroke] stroke-surface stroke-[4px] [stroke-linejoin:round]"
        >
          <tspan class="fill-body font-medium">{{ n.label }}</tspan>
          <tspan class="fill-muted font-mono text-[11.5px]" dx="8">{{ nl(n.value) }}</tspan>
        </text>
      </g>

      <!-- Column heads. -->
      <g class="fill-label text-[10.5px] font-bold tracking-[0.08em]">
        <text :x="COLUMNS[0] + NODE" y="12" text-anchor="end">BRON</text>
        <text :x="COLUMNS[1]" y="12">UITKOMST</text>
        <text :x="COLUMNS[2]" y="12">IN DETAIL</text>
      </g>
    </svg>

    <div
      v-if="tip"
      class="pointer-events-none absolute z-10 max-w-[280px] rounded-lg border border-line bg-surface px-3 py-2 shadow-sm"
      :style="{ left: `${Math.min(tip.x + 14, (box?.clientWidth ?? 0) - 290)}px`, top: `${tip.y + 14}px` }"
      role="tooltip"
    >
      <p class="text-md font-semibold text-ink">{{ tip.title }}</p>
      <p class="text-sm text-muted">{{ tip.line }}</p>
      <p class="text-xs mt-0.5 text-faint">Klik om te openen</p>
    </div>
  </div>
</template>
