<template>
  <div class="MapBox">
    <MglMap
      class="MapBox__wrapper" 
      :accessToken="accessToken"
      :mapStyle.sync="mapStyle"
      :transformRequest="transformRequest"
      @load="onMapLoaded" />
  </div>
</template>

<script>
import { MglMap } from 'vue-mapbox';

import { authHeader } from 'service/auth'

import { mapGetters, mapMutations, mapActions } from 'vuex'

export default {
  components: {
    MglMap
  },
  data() {
    return {
      accessToken: process.env.VUE_APP_MAPBOX_TOKEN,
      mapStyle: process.env.VUE_APP_MAPBOX_STYLE
    }
  },
  computed: {
    ...mapGetters('map', [
      'mapLayers',
      'activeLayer',
      'hasMapLayers',
      'isMapboxReady'
    ]),
    readyToLoadLayers() {
      return this.isMapboxReady && this.hasMapLayers
    }
  },
  watch: {
    readyToLoadLayers(value) {
      if (value) {
        this.addLayersToMapbox()
      }
    },
    activeLayer() {
      this.switchLayer()
    }
  },
  created() {
    if (! this.hasMapLayers) {
      this.getMapLayers()
    }
  },
  beforeDestroy() {
    // TODO: We may want to keep the map in memory for faster loading
    this.mapboxIsReady({ status: false })
  },
  methods: {
    ...mapActions('map', [
      'getMapLayers'
    ]),
    ...mapMutations('map', [
      'mapboxIsReady'
    ]),
    onMapLoaded(event) {
      // Note: a reference to the map has to be stored in a non-reactive manner.
      this.$store.map = event.map;
      this.mapboxIsReady({ status: true })
    },
    transformRequest(url, resourceType) {
      // TODO: This url matching trick is dangerous and should be replaced
      if (resourceType == 'Source' && url.startsWith(process.env.VUE_APP_API_BASE_URL)) {
        return {
          url: url,
          headers: authHeader()
        }
      }
    },
    switchLayer() {
      if (this.isMapboxReady) {
        // TODO: Test whether we first need to hide all
        this.mapLayers.forEach(layer => {
          let source = this.$store.map.getSource(layer.id)
          if (source) {
            this.$store.map.setLayoutProperty(
              layer.id, 'visibility', this.getLayerVisibility({ layer })
            )
          }
        })
      }
    },
    addLayersToMapbox() {
      this.mapLayers.forEach(layer => {
        this.$store.map.addSource(layer.id, {
          type: 'geojson',
          data: `${process.env.VUE_APP_API_BASE_URL}${layer.source}`
        })
        this.$store.map.addLayer({
          "id": layer.id,
          "type": "circle",
          "source": layer.id,
          'layout': {
            'visibility': this.getLayerVisibility({ layer }),
          },
          "paint": {
            'circle-radius': 8,
            "circle-color": ['get', 'color'],
            "circle-opacity": 0.8,
            "circle-stroke-width": 0,
          }
        })
      })
    },
    getLayerVisibility({ layer }) {
      return (this.activeLayer && this.activeLayer.id === layer.id) ? 'visible' : 'none'
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

  .MapBox, .MapBox__wrapper {
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
