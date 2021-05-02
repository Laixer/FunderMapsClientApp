<template>
  <div id="mapContainer" />
</template>

<script>
import mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import { MapLayer } from "@/models/MapLayer";
import { mapGetters, mapMutations } from "vuex";

import { generateTooltipForFeature } from "helper/paint";

const bundles = [
  {
    id: 1,
    name: "Gebouw",
    layers: [
      new MapLayer(
        "a",
        '{"type": "range_num", "column": "built_year", "values": [{"max": "1960", "min": "0", "color": "#293575", "label": "< 1960"}, {"max": "1970", "min": "1960", "color": "#1261A3", "label": "1960 t/m 1970"}, {"max": "1980", "min": "1970", "color": "#69A8DE", "label": "1970 t/m 1980"}, {"max": "1990", "min": "1980", "color": "#99C1E9", "label": "1980 t/m 1990"}, {"max": "2000", "min": "1990", "color": "#B378B1", "label": "1990 t/m 2000"}, {"max": "2010", "min": "2000", "color": "#bd6495", "label": "2000 t/m 2010"}, {"max": "2020", "min": "2010", "color": "#ba2351", "label": "2010 t/m 2020"}, {"max": "9999", "min": "2020", "color": "#d11313", "label": "> 2020"}]}',
        "Bouwjaar",
        "construction-year"
      ),
    ],
  },
  {
    id: 2,
    name: "Fundering",
    layers: [
      new MapLayer(
        "d",
        '{"type": "case_multimatch", "column": "foundation_type", "values": [{"color": "#c75d43", "label": "Houten paal", "match": ["wood", "weighted_pile", "wood_amsterdam", "wood_rotterdam"]}, {"color": "#deb271", "label": "Houten paal met oplanger", "match": ["wood_charger"]}, {"color": "#6a6c70", "label": "Betonnen paal", "match": ["concrete"]}, {"color": "#ff3333", "label": "Op staal", "match": ["no_pile", "no_pile_masonry", "no_pile_strips", "no_pile_concrete_floor", "no_pile_slit", "no_pile_bearing_floor"]}, {"color": "#bdbebf", "label": "Stalen paal", "match": ["steel_pile"]}, {"color": "#7192de", "label": "Verzwaarde betonpuntpaal", "match": ["weighted_pile"]}, {"color": "#b271de", "label": "Combinatie", "match": ["combined"]}, {"color": "#ffec33", "label": "Overig", "match": ["other"]}, {"color": "#71decc", "label": "Onbekend", "match": ["unknown"]}]}',
        "Funderingstype vastgesteld",
        "foundation-type-established"
      ),
      new MapLayer(
        "f",
        '{"type": "case_multimatch", "column": "type", "values": [{"color": "#5cbe55", "label": "Volledig herstel", "match": ["table"]}, {"color": "#47baa5", "label": "Partieel herstel", "match": ["pile_in_wall"]}, {"color": "#8c4bb6", "label": "Paalkop verlaging", "match": ["pile_lowering", "beam_on_pile"]}, {"color": "#c67e70", "label": "Grondverbetering", "match": ["injection"]}, {"color": "#5B4AB7", "label": "Onbekend", "match": ["unknown"]}]}',
        "Hersteld",
        "foundation-recovery"
      ),
    ],
  },
  {
    id: 3,
    name: "Schiedam",
    layers: [
      new MapLayer(
        "g",
        '{"type": "color", "column": "meldingen123kleurtest", "values": {"color": "#d90890"}}',
        "Incident",
        "incident-schiedam"
      ),
      new MapLayer(
        "h",
        '{"type": "color", "column": "meldingen123kleurtest", "values": {"color": "#1f0bf9"}}',
        "Monitoring",
        "monitoring-schiedam"
      ),
    ],
  },
];

export default {
  data() {
    return {
      accessToken: process.env.VUE_APP_MAPBOX_TOKEN,
      mapStyle: "mapbox://styles/laixer/cknycxq5h1f9a17pj578xieqj",
      map: null,
      popup: null,
    };
  },
  computed: {
    ...mapGetters("map", ["mapBundles", "activeBundle", "isMapboxReady"]),
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
    this.setBundles({ bundles });

    mapboxgl.accessToken = this.accessToken;

    this.map = new mapboxgl.Map({
      container: "mapContainer",
      style: this.mapStyle,
      attributionControl: false,
      antialias: true,
      bearing: 0,
      zoom: 14,
      pitch: 45,
      center: [4.408, 51.918],
      maxBounds: [
        [4.350671425154455, 51.89667871124658],
        [4.417712993804581, 51.963406624303175],
      ],
    });
    this.map.addControl(
      new MapboxGeocoder({
        accessToken: this.accessToken,
        mapboxgl: mapboxgl,
      })
    );

    this.map.addControl(new mapboxgl.GeolocateControl());
    this.map.addControl(new mapboxgl.NavigationControl(), "top-right");
    this.map.addControl(new mapboxgl.FullscreenControl());

    this.map.on("load", this.onMapLoaded);
  },
  beforeDestroy() {
    this.mapboxIsReady({ status: false });
  },
  methods: {
    ...mapMutations("map", ["mapboxIsReady", "setBundles"]),
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
