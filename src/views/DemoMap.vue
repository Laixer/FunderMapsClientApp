<template>
  <MglMap
    class="MapBox" 
    :accessToken="accessToken"
    :mapStyle.sync="mapStyle"
    @load="onMapLoaded" />
</template>

<script>
import { MglMap } from 'vue-mapbox';
// import mapboxgl from 'mapbox-gl';

import { mapGetters, mapActions } from 'vuex'

export default {
  components: {
    MglMap
  },
  data() {
    return {
      accessToken: 'pk.eyJ1Ijoiam91cm5leXdvcmtzIiwiYSI6ImNqeDd6Nm5oNDBlZGkzc3A3Zm40ZzVhb3YifQ.7Pi9HnHW3r-PU-koxWLYGw',
      mapStyle: 'mapbox://styles/journeyworks/cjx7z8ar10m081cm6gq6uyjez'
    }
  },
  computed: {
    ...mapGetters('map', [
      'hasMapData',
      'mapData'
    ])
  },
  created() {
    // TODO: Use the endpoint instead of static file
    // this.getMapData()
  },
  methods: {
    ...mapActions('map', [
      'getMapData'
    ]),
    onMapLoaded(event) {
      // Note: a reference to the map has to be stored in a non-reactive manner.
      this.$store.map = event.map;

      this.addSamplePoints();
    },
    addSamplePoints() {
      this.$store.map.addSource('sample-source', {
        type: 'geojson',
        data: '/mapData.json'
      });
      this.$store.map.addSource('historic-foundation', {
        type: 'geojson',
        data: '/historic_foundation.json'
      });
      this.$store.map.addSource('wood-concrete', {
        type: 'geojson',
        data: '/wood_or_concrete.json'
      });
      this.$store.map.addSource('no-pile', {
        type: 'geojson',
        data: '/no_pile.json'
      });
      this.$store.map.addSource('concrete', {
        type: 'geojson',
        data: '/concrete.json'
      });
      this.$store.map.addLayer({
        "id": "samples",
        "type": "circle",
        "source": 'sample-source',
        "paint": {
            'circle-radius': 8,
            "circle-color": '#2da798',
            "circle-opacity": 0.8,
            "circle-stroke-width": 0,
        }
      });
      this.$store.map.addLayer({
        "id": "samples2",
        "type": "circle",
        "source": 'historic-foundation',
        "paint": {
            'circle-radius': 8,
            "circle-color": '#005ce6',
            "circle-opacity": 0.8,
            "circle-stroke-width": 0,
        }
      });
      this.$store.map.addLayer({
        "id": "samples3",
        "type": "circle",
        "source": 'wood-concrete',
        "paint": {
            'circle-radius': 8,
            "circle-color": '#e60000',
            "circle-opacity": 0.8,
            "circle-stroke-width": 0,
        }
      });
      this.$store.map.addLayer({
        "id": "samples4",
        "type": "circle",
        "source": 'no-pile',
        "paint": {
            'circle-radius': 8,
            "circle-color": '#00e64d',
            "circle-opacity": 0.8,
            "circle-stroke-width": 0,
        }
      });
      this.$store.map.addLayer({
        "id": "samples5",
        "type": "circle",
        "source": 'concrete',
        "paint": {
            'circle-radius': 8,
            "circle-color": '#ac00e6',
            "circle-opacity": 0.8,
            "circle-stroke-width": 0,
        }
      });
    }
  }
}
</script>

<style lang="scss">
  .mapboxgl-canvas-container, .mapboxgl-canvas {
    &:active, &:focus {
      outline: none;
    }
  }

  .mapboxgl-marker {
    position: absolute;
    cursor: pointer;
  }

  .mapboxgl-map {
    width: 100% !important;
    height: 100% !important;
  }

  // Hide MapBox logo
  .mapboxgl-ctrl.mapboxgl-ctrl-attrib, .mapboxgl-ctrl {
    display: none !important;
  }
  .MapBox {
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    user-select: none;
  }
</style>
