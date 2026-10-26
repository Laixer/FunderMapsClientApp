<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef, useTemplateRef, watch } from 'vue'
import { useResizeObserver } from '@vueuse/core'
import { LngLatBounds, Map as MaplibreMap, NavigationControl, setWorkerUrl, type GeoJSONSource } from 'maplibre-gl'
// See SampleMap.vue: maplibre v6 needs its worker URL from the bundler.
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import 'maplibre-gl/dist/maplibre-gl.css'

import type { IDataopsMap } from '@/services/fundermaps/interfaces/IDataops'

setWorkerUrl(maplibreWorkerUrl)

/**
 * Where the dossiers come from (2026-10-22): one circle per municipality on
 * the FunderMaps basemap, its area as the number of dossiers (radius by the
 * square root), green like "in FunderMaps" on the Datastroom. Hover for the
 * municipality's numbers. Loaded on demand (MapLibre is large), like SampleMap.
 */
const props = defineProps<{ data: IDataopsMap }>()
/** A click on a circle: its municipality (the page opens Controle on it). */
const emit = defineEmits<{ select: [m: { code: string; name: string }] }>()

const container = useTemplateRef<HTMLElement>('container')
const map = shallowRef<MaplibreMap | null>(null)
const tip = ref<{ x: number; y: number; name: string; line: string } | null>(null)

const style = import.meta.env.VITE_BASEMAP_STYLE || 'https://tiles.fundermaps.com/style/fundermaps-basemap'
const nl = (n: number) => n.toLocaleString('nl-NL')

function geojson() {
  return {
    type: 'FeatureCollection' as const,
    features: props.data.municipalities.map((m) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [m.lon, m.lat] },
      properties: { code: m.code, name: m.name, dossiers: m.dossiers, done: m.done, open: m.open },
    })),
  }
}

function frame() {
  const m = map.value
  if (!m || !props.data.municipalities.length) return
  const bounds = new LngLatBounds()
  for (const p of props.data.municipalities) bounds.extend([p.lon, p.lat])
  m.fitBounds(bounds, { padding: 36, maxZoom: 9, duration: 0 })
}

onMounted(() => {
  if (!container.value) return
  const m = new MaplibreMap({
    container: container.value,
    style,
    center: [5.3, 52.2],
    zoom: 6.3,
    // An overview on a page that scrolls: the wheel scrolls the page, the buttons zoom.
    scrollZoom: false,
    attributionControl: { compact: true },
    locale: {
      'AttributionControl.ToggleAttribution': 'Bronvermelding van de kaart tonen of verbergen',
      'NavigationControl.ZoomIn': 'Inzoomen',
      'NavigationControl.ZoomOut': 'Uitzoomen',
    },
  })
  m.addControl(new NavigationControl({ showCompass: false }), 'top-right')
  m.on('load', () => {
    map.value = m
    m.addSource('origin', { type: 'geojson', data: geojson() })
    m.addLayer({
      id: 'origin',
      type: 'circle',
      source: 'origin',
      paint: {
        // Area as the count: the radius goes with the square root (989 dossiers → ~26px).
        'circle-radius': ['interpolate', ['linear'], ['sqrt', ['get', 'dossiers']], 1, 3, 32, 26],
        'circle-color': '#12875a',
        'circle-opacity': 0.55,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 1,
      },
    })
    m.on('mousemove', 'origin', (e) => {
      const f = e.features?.[0]
      if (!f) return
      const p = f.properties as { name: string; dossiers: number; done: number; open: number }
      m.getCanvas().style.cursor = 'pointer'
      tip.value = {
        x: e.point.x,
        y: e.point.y,
        name: p.name,
        line: `${nl(p.dossiers)} dossiers · ${nl(p.done)} in FunderMaps · ${nl(p.open)} open`,
      }
    })
    m.on('click', 'origin', (e) => {
      const p = e.features?.[0]?.properties as { code: string; name: string } | undefined
      if (p) emit('select', { code: p.code, name: p.name })
    })
    m.on('mouseleave', 'origin', () => {
      tip.value = null
      m.getCanvas().style.cursor = ''
    })
    requestAnimationFrame(() => m.resize())
    frame()
  })
})

watch(
  () => props.data,
  () => {
    ;(map.value?.getSource('origin') as GeoJSONSource | undefined)?.setData(geojson())
    frame()
  },
)

useResizeObserver(container, () => map.value?.resize())

onBeforeUnmount(() => {
  map.value?.remove()
  map.value = null
})
</script>

<template>
  <div class="relative h-full w-full">
    <div ref="container" class="h-full w-full" role="img" :aria-label="`Kaart met de dossiers per gemeente, ${data.municipalities.length} gemeenten`"></div>
    <div
      v-if="tip"
      class="pointer-events-none absolute z-10 rounded-lg border border-line bg-surface px-3 py-2 shadow-sm"
      :style="{ left: `${tip.x + 12}px`, top: `${tip.y + 12}px` }"
      role="tooltip"
    >
      <p class="text-md font-semibold text-ink">{{ tip.name }}</p>
      <p class="text-sm text-muted">{{ tip.line }}</p>
      <p class="text-xs mt-0.5 text-faint">klik: de open dossiers in Controle</p>
    </div>
  </div>
</template>
