<script setup lang="ts">
import { onBeforeUnmount, onMounted, shallowRef, useTemplateRef, watch } from 'vue'
import { useResizeObserver } from '@vueuse/core'
import { LngLatBounds, Map as MaplibreMap, NavigationControl, setWorkerUrl, type GeoJSONSource, type GeoJSONSourceSpecification } from 'maplibre-gl'
// See SampleMap.vue: maplibre v6 needs its worker URL from the bundler.
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import 'maplibre-gl/dist/maplibre-gl.css'

setWorkerUrl(maplibreWorkerUrl)

/**
 * One pand on the FunderMaps basemap (the Pand page, 2026-10-22): its outline
 * filled green, framed with room around it so the street shows. Loaded on
 * demand like the other maps; the wheel scrolls the page, the buttons zoom.
 */
type Outline = { type: 'Polygon' | 'MultiPolygon'; coordinates: unknown }
const props = defineProps<{ outline: Outline; lat: number; lon: number }>()

const container = useTemplateRef<HTMLElement>('container')
const map = shallowRef<MaplibreMap | null>(null)
const style = import.meta.env.VITE_BASEMAP_STYLE || 'https://tiles.fundermaps.com/style/fundermaps-basemap'

// The API's outline is GeoJSON already; MapLibre's own type for it, without pulling in @types/geojson.
const feature = () => ({ type: 'Feature', geometry: props.outline, properties: {} }) as unknown as GeoJSONSourceSpecification['data']

/** Every corner of the outline, whatever its nesting (Polygon or MultiPolygon). */
function corners(c: unknown, out: [number, number][] = []): [number, number][] {
  if (Array.isArray(c) && typeof c[0] === 'number') out.push([c[0] as number, c[1] as number])
  else if (Array.isArray(c)) for (const x of c) corners(x, out)
  return out
}

function frame() {
  const m = map.value
  if (!m) return
  const bounds = new LngLatBounds()
  for (const p of corners(props.outline.coordinates)) bounds.extend(p)
  if (bounds.isEmpty()) m.jumpTo({ center: [props.lon, props.lat], zoom: 18 })
  else m.fitBounds(bounds, { padding: 70, maxZoom: 18.5, duration: 0 })
}

onMounted(() => {
  if (!container.value) return
  const m = new MaplibreMap({
    container: container.value,
    style,
    center: [props.lon, props.lat],
    zoom: 17.5,
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
    m.addSource('pand', { type: 'geojson', data: feature() })
    m.addLayer({ id: 'pand-fill', type: 'fill', source: 'pand', paint: { 'fill-color': '#12875a', 'fill-opacity': 0.35 } })
    m.addLayer({ id: 'pand-line', type: 'line', source: 'pand', paint: { 'line-color': '#0b5e3e', 'line-width': 2 } })
    requestAnimationFrame(() => m.resize())
    frame()
  })
})

watch(
  () => props.outline,
  () => {
    ;(map.value?.getSource('pand') as GeoJSONSource | undefined)?.setData(feature())
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
  <div ref="container" class="h-full w-full" role="img" aria-label="Kaart met de omtrek van het pand"></div>
</template>
