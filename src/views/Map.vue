<template>
  <div id="mapContainer" />
</template>

<script>
import mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import { mapGetters, mapMutations } from "vuex";

import { generateTooltipForFeature } from "helper/paint";

export default {
  data() {
    return {
      accessToken: process.env.VUE_APP_MAPBOX_TOKEN,
      mapStyle: process.env.VUE_APP_MAPBOX_STYLE,
      map: null,
      popup: null,
    };
  },
  computed: {
    ...mapGetters("map", ["mapBundles", "activeBundle", "isMapboxReady"]),
    ...mapGetters("org", ["currentOrganization"]),
  },
  watch: {
    activeBundle(value) {
      if (this.popup !== null) {
        this.popup.remove();
      }
      if (this.isMapboxReady) {
        for (const bundle of this.mapBundles) {
          for (let layer of bundle.layers) {
            layer.visibility = "none";
            this.$store.map.setLayoutProperty(
              layer.slug,
              "visibility",
              layer.visibility
            );
          }
        }
        this.$store.map.triggerRepaint();
      }
    },
  },
  mounted() {
    mapboxgl.accessToken = this.accessToken;

    const mapOpions = {
      container: "mapContainer",
      style: this.mapStyle,
      attributionControl: false,
      antialias: true,
      bearing: 0,
      zoom: 14,
      pitch: 45,
      center: [
        5.2793703,
        52.2129919
      ],
    }

    if (this.currentOrganization.center) {
      mapOpions.center = [
        this.currentOrganization.center.centerX,
        this.currentOrganization.center.centerY,
      ];
    }

    if (this.currentOrganization.area) {
      mapOpions.maxBounds = [
        [this.currentOrganization.area.xMin, this.currentOrganization.area.yMin],
        [this.currentOrganization.area.xMax, this.currentOrganization.area.yMax],
      ];
    }

    this.map = new mapboxgl.Map(mapOpions);
    this.map.addControl(
      new MapboxGeocoder({
        accessToken: this.accessToken,
        mapboxgl: mapboxgl,
      })
    );

    this.map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
        showUserHeading: true,
      })
    );
    this.map.addControl(new mapboxgl.NavigationControl(), "top-right");
    this.map.addControl(new mapboxgl.FullscreenControl());

    this.map.on("load", this.onMapLoaded);
  },
  beforeDestroy() {
    this.mapboxIsReady({ status: false });
  },
  methods: {
    ...mapMutations("map", ["mapboxIsReady"]),
    onMapLoaded(event) {
      this.$store.map = event.target;
      this.mapboxIsReady({ status: true });
      for (const bundle of this.mapBundles) {
        for (let layer of bundle.layers) {
          this.$store.map.on("mouseenter", layer.slug, () => {
            this.$store.map.getCanvas().style.cursor = "pointer";
          });
          this.$store.map.on("mouseleave", layer.slug, () => {
            this.$store.map.getCanvas().style.cursor = "";
          });
          this.$store.map.on("click", layer.slug, (e) => {
            const html = generateTooltipForFeature(layer, e.features[0]);
            this.popup = new mapboxgl.Popup()
              .setLngLat(e.features[0].geometry.coordinates[0][0])
              .setHTML(html)
              .addTo(this.$store.map);
          });
        }
      }
    },
  },
};
</script>

<style src='mapbox-gl/dist/mapbox-gl.css'></style>
<style src='@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'></style>

<style lang="scss">
.mapboxgl-ctrl-geocoder {
  min-width: 340px;
}

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

.mapboxgl-popup-content {
  padding: 0;
}

.mapboxgl-map {
  width: 100% !important;
  height: 100% !important;
}

a.mapboxgl-ctrl-logo {
  display: none;
}

.mapboxgl-ctrl-group {
  border-radius: 0;
}
</style>
