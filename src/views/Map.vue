<template>
  <div class="MapBox">
    <MglMap
      class="MapBox__wrapper"
      :accessToken="accessToken"
      :mapStyle.sync="mapStyle"
      :transformRequest="transformRequest"
      :attributionControl="false"
      @load="onMapLoaded"
    >
      <MglFullscreenControl />
      <MglGeolocateControl position="top-right" />
    </MglMap>
  </div>
</template>

<script>
import { MglMap, MglGeolocateControl, MglFullscreenControl } from "vue-mapbox";

import { Popup } from 'mapbox-gl';

import { generatePaintStyleFromJSON } from 'helper/paint';

import { authHeader } from "service/auth";

import { mapGetters, mapMutations, mapActions } from "vuex";

import mapAPI from "api/map";

export default {
  components: {
    MglMap,
    MglGeolocateControl,
    MglFullscreenControl
  },
  data() {
    return {
      mvt_base_url: process.env.VUE_APP_MVT_BASE_URL,
      accessToken: process.env.VUE_APP_MAPBOX_TOKEN,
      mapStyle: process.env.VUE_APP_MAPBOX_STYLE,
      popupFeature: null
    };
  },
  computed: {
    ...mapGetters("map", [
      "mapBundles",
      "mapLayers",
      "activeBundle",
      "activeLayers",
      "hasMapData",
      "isMapboxReady"
    ]),
    ...mapGetters("org", ["organization"]),
    readyToLoadBundles() {
      return this.isMapboxReady && this.hasMapData;
    }
  },
  watch: {
    async readyToLoadBundles(value) {
      if (value) {
        await this.addBundlesToMapbox();
      }
    },
    activeBundle(value) {
      if (this.isMapboxReady) {
        this.panToActiveBundle()

        for (const bundle of this.mapBundles) {
          for (const layer of this.mapLayers.filter(v => bundle.layerConfiguration.layers.find(a => a.layerId === v.id))) {
            this.$store.map.setLayoutProperty(
              `${bundle.id}_${layer.id}`,
              "visibility",
              (bundle.id === this.activeBundle.id) ? layer.visibility : 'none'
            );
          }
        }
        this.$store.map.triggerRepaint();
      }
    },
  },
  async created() {
    if (!this.hasMapData) {
      try {
        await this.getMapBundles();
      } catch (err) {
        if (err.response && err.response.status === 401) {
          this.$router.push({ name: "login" });
        }
      }
    }
  },
  beforeDestroy() {
    // TODO: We may want to keep the map in memory for faster loading
    this.mapboxIsReady({ status: false });
  },
  methods: {
    ...mapActions("map", ["getMapBundles"]),
    ...mapMutations("map", ["mapboxIsReady"]),
    onMapLoaded(event) {
      // NOTE: a reference to the map has to be stored in a non-reactive manner.
      this.$store.map = event.map;
      this.panToActiveBundle()
      this.mapboxIsReady({ status: true });
    },
    transformRequest(url, resourceType) {
      // TODO: This url matching trick is dangerous and should be replaced
      if (
        resourceType == "Source" &&
        url.startsWith(process.env.VUE_APP_API_BASE_URL)
      ) {
        return {
          url: url,
          headers: authHeader()
        };
      }
    },
    setPopupFeature(feature) {
      this.popupFeature = feature
    },
    async addBundlesToMapbox() {
      for (const bundle of this.mapBundles) {
        const url = `${this.mvt_base_url}ORG${bundle.organizationId}/BND${bundle.id}/MVT/${bundle.id}/{z}/{x}/{y}.pbf`
        this.$store.map.addSource(bundle.id, {
          type: "vector",
          tiles: [url],
        });

        const layers = this.$store.map.getStyle().layers
        let firstSymbolLayerId = null
        for (var i = 0; i < layers.length; i++) {
          if (layers[i].type === 'symbol') {
            firstSymbolLayerId = layers[i].id;
            break;
          }
        }

        for (const [index, layer] of this.mapLayers.filter(layer => bundle.layerConfiguration.layers.find(layerConfig => layer.id === layerConfig.layerId)).entries()) {
          layer.visibility = index == 0 ? 'visible' : 'none'

          const uniqueId = `${bundle.id}_${layer.id}`
          this.$store.map.addLayer({
            id: uniqueId,
            type: "fill",
            source: bundle.id,
            'source-layer': layer.slug,
            layout: {
              visibility: (bundle.id == this.activeBundle.id) ? layer.visibility : 'none'
            },
            minzoom: bundle.metadata.minzoom || 1,
            // maxzoom: bundle.metadata.maxzoom || 24,
            paint: generatePaintStyleFromJSON(JSON.parse(layer.markup))
          }, firstSymbolLayerId);

          this.$store.map.on('click', uniqueId, (e) => {
            this.setPopupFeature(e.features[0])

            let html = ""
            for (const [key, value] of Object.entries(this.popupFeature.properties)) {
              if (key == 'external_id' || key == 'id') continue
              html += `<span><b>${key}:</b> ${value}</span><br>`
            }

            new Popup()
              .setLngLat(this.popupFeature.geometry.coordinates[0][0])
              .setHTML(html)
              .addTo(this.$store.map)

          });

          this.$store.map.on('mouseenter', uniqueId, () => {
            this.$store.map.getCanvas().style.cursor = 'pointer';
          });

          this.$store.map.on('mouseleave', uniqueId, () => {
            this.$store.map.getCanvas().style.cursor = '';
            this.setPopupFeature(null)
          });

        }
      }
    },
    getBundleVisibility({ bundle }) {
      return this.activeBundle && this.activeBundle.id === bundle.id
        ? "visible"
        : "none";
    },
    panToActiveBundle() {
      if (this.activeBundle) {
        const split = this.activeBundle.metadata.center.split(',')
        const center = [split[0], split[1]]
        const zoom = split[2]
        this.$store.map.flyTo({
          center: center,
          zoom: zoom,
          speed: 1
        })
      }
    }
  }
};
</script>

<style src='mapbox-gl/dist/mapbox-gl.css'></style>

<style lang="scss">
.mapboxgl-canvas-container,
.mapboxgl-canvas {
  &:active,
  &:focus {
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

.MapBox,
.MapBox__wrapper {
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

a.mapboxgl-ctrl-logo {
  display: none;
}

.mapboxgl-ctrl-group {
  border-radius: 0;
}
</style>
