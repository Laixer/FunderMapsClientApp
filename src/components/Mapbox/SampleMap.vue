<script setup lang="ts">
import { onBeforeUnmount, onMounted, shallowRef, useTemplateRef, watch } from 'vue'
import mapboxgl, { type Map as MapboxMap, type Marker } from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

export interface SamplePin {
  id: string | number
  lng: number
  lat: number
}

const props = withDefaults(
  defineProps<{
    pins: SamplePin[]
    selectedId?: string | number | null
    /** Zoom level used when there's exactly one pin to fit. Multi-pin sets use fitBounds. */
    singlePinZoom?: number
  }>(),
  { selectedId: null, singlePinZoom: 17 },
)

const emit = defineEmits<{ select: [id: string | number] }>()

const container = useTemplateRef<HTMLElement>('container')
const mapInstance = shallowRef<MapboxMap | null>(null)
// Marker per pin id. Selection state is reflected on the existing element
// instead of rebuilding markers — avoids a flicker on every click.
const markerById = new Map<string | number, { marker: Marker; el: HTMLElement }>()

// Centroid of NL — used as the initial center when the map mounts before any
// pins exist. The first pins-change fitBounds immediately repositions, so the
// user never actually sees this view.
const FALLBACK_CENTER: [number, number] = [4.897, 52.378]

// Falsy token / style → no map. Caller hides the component or accepts a blank
// container; either way the rest of the wizard keeps working.
const token = import.meta.env.VITE_MAPBOX_TOKEN
const style = import.meta.env.VITE_MAPBOX_STYLE

function makePinEl(id: string | number): HTMLElement {
  const el = document.createElement('div')
  el.className = 'sample-pin'
  el.setAttribute('data-selected', String(id === props.selectedId))
  el.addEventListener('click', () => emit('select', id))
  return el
}

function rebuildMarkers(): void {
  const map = mapInstance.value
  if (!map) return

  const wanted = new Set(props.pins.map((p) => p.id))

  // Remove markers no longer in the pins list.
  for (const [id, entry] of markerById) {
    if (!wanted.has(id)) {
      entry.marker.remove()
      markerById.delete(id)
    }
  }

  // Add or move markers for the current pins.
  for (const pin of props.pins) {
    const existing = markerById.get(pin.id)
    if (existing) {
      existing.marker.setLngLat([pin.lng, pin.lat])
    } else {
      const el = makePinEl(pin.id)
      const marker = new mapboxgl.Marker({ element: el }).setLngLat([pin.lng, pin.lat]).addTo(map)
      markerById.set(pin.id, { marker, el })
    }
  }
}

function updateSelection(): void {
  for (const [id, { el }] of markerById) {
    el.setAttribute('data-selected', String(id === props.selectedId))
  }
}

// Frame the visible pins. One pin → fly to it; many → fit a bounding box with
// padding so the selected one isn't pressed against the edge.
function frame(): void {
  const map = mapInstance.value
  if (!map || !props.pins.length) return

  if (props.pins.length === 1) {
    const p = props.pins[0]
    map.flyTo({ center: [p.lng, p.lat], zoom: props.singlePinZoom, essential: true })
    return
  }

  const bounds = new mapboxgl.LngLatBounds()
  for (const p of props.pins) bounds.extend([p.lng, p.lat])
  map.fitBounds(bounds, { padding: 60, maxZoom: 18, duration: 400 })
}

onMounted(() => {
  if (!container.value || !token || !style) return
  mapboxgl.accessToken = token

  const initial = props.pins[0]
  const map = new mapboxgl.Map({
    container: container.value,
    style,
    center: initial ? [initial.lng, initial.lat] : FALLBACK_CENTER,
    zoom: initial ? props.singlePinZoom : 8,
    attributionControl: false,
  })

  map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')

  map.on('load', () => {
    mapInstance.value = map
    rebuildMarkers()
    frame()
  })
})

onBeforeUnmount(() => {
  for (const { marker } of markerById.values()) marker.remove()
  markerById.clear()
  mapInstance.value?.remove()
  mapInstance.value = null
})

watch(
  () => props.pins,
  () => {
    rebuildMarkers()
    frame()
  },
  { deep: true },
)

watch(() => props.selectedId, updateSelection)
</script>

<template>
  <div v-if="token && style" ref="container" class="h-full w-full"></div>
  <div
    v-else
    class="flex h-full w-full items-center justify-center rounded-md border border-grey-200 bg-grey-100 text-xs text-grey-700"
  >
    Kaart niet beschikbaar (geen Mapbox-token geconfigureerd).
  </div>
</template>

<style scoped>
:deep(.sample-pin) {
  width: 16px;
  height: 16px;
  border-radius: 9999px;
  background: var(--color-grey-400);
  border: 2px solid white;
  box-shadow: 0 0 0 1px var(--color-grey-400);
  cursor: pointer;
  transition:
    transform 150ms ease,
    background-color 150ms ease,
    box-shadow 150ms ease;
}

:deep(.sample-pin:hover) {
  background: var(--color-grey-800);
  box-shadow: 0 0 0 1px var(--color-grey-800);
}

:deep(.sample-pin[data-selected="true"]) {
  background: var(--color-green-500);
  box-shadow:
    0 0 0 2px var(--color-green-500),
    0 4px 8px rgb(0 0 0 / 0.15);
  transform: scale(1.25);
}
</style>
