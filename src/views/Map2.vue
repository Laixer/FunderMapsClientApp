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
        name: 'Gebouw',
        layers: [
            new MapLayer('a', '{"type": "range_num", "column": "built_year", "values": [{"max": "1960", "min": "0", "color": "#293575", "label": "< 1960"}, {"max": "1970", "min": "1960", "color": "#1261A3", "label": "1960 t/m 1970"}, {"max": "1980", "min": "1970", "color": "#69A8DE", "label": "1970 t/m 1980"}, {"max": "1990", "min": "1980", "color": "#99C1E9", "label": "1980 t/m 1990"}, {"max": "2000", "min": "1990", "color": "#B378B1", "label": "1990 t/m 2000"}, {"max": "2010", "min": "2000", "color": "#bd6495", "label": "2000 t/m 2010"}, {"max": "2020", "min": "2010", "color": "#ba2351", "label": "2010 t/m 2020"}, {"max": "9999", "min": "2020", "color": "#d11313", "label": "> 2020"}]}', 'Bouwjaar', 'construction-year'),
            // new MapLayer('b', '{"type": "range_num", "column": "velocity", "values": [{"max": "9999", "min": "0", "color": "#f7fbff", "label": "> 0 mm/jaar"}, {"max": "0", "min": "-0.5", "color": "#d8e7f5", "label": "0,0 t/m -0,5 mm/jaar"}, {"max": "-0.5", "min": "-1", "color": "#b0d2e8", "label": "-0,5 t/m -1,0 mm/jaar"}, {"max": "-1", "min": "-1.5", "color": "#73b3d8", "label": "-1,0 t/m -1,5 mm/jaar"}, {"max": "-1.5", "min": "-2", "color": "#3e8ec4", "label": "-1,5 t/m -2,0 mm/jaar"}, {"max": "-2", "min": "-2.5", "color": "#1563aa", "label": "-2,0 t/m -2,5 mm/jaar"}, {"max": "-2.5", "min": "-9999", "color": "#08306b", "label": "< -2,5 mm/jaar"}]}', 'Pandzakking', 'velocity'),
            // new MapLayer('c', '{"type": "color", "column": "meldingen123kleurtest", "values": {"color": "#d11313"}}', 'Eigendom', 'owner'),
            // new MapLayer('m', '{"type": "range_num","column": "built_year","values": [{"max": "1960","min": "0","color": "#f7fbff","label": "€10.000"},{"max": "1970","min": "1960","color": "#d8e7f5","label": "€10.000 t/m €25.000"},{"max": "1980","min": "1970","color": "#b0d2e8","label": "€25.000 t/m €50.000"},{"max": "1990","min": "1980","color": "#73b3d8","label": "€50.000 t/m €75.000"},{"max": "2000","min": "1990","color": "#3e8ec4","label": "€75.000 t/m €100.000"},{"max": "2010","min": "2000","color": "#1563aa","label": "€100.000 t/m €125.000"},{"max": "2020","min": "2010","color": "#08306b","label": "€125.000 t/m €150.000"},{"max": "9999","min": "2020","color": "#010d1d","label": "> €150.000"}]}', 'Herstelkosten', 'restoration-cost'),
        ]
    },
    {
        id: 2,
        name: 'Fundering',
        layers: [
            new MapLayer('d', '{"type": "case_multimatch", "column": "foundation_type", "values": [{"color": "#c75d43", "label": "Houten paal", "match": ["wood", "weighted_pile", "wood_amsterdam", "wood_rotterdam"]}, {"color": "#deb271", "label": "Houten paal met oplanger", "match": ["wood_charger"]}, {"color": "#6a6c70", "label": "Betonnen paal", "match": ["concrete"]}, {"color": "#ff3333", "label": "Op staal", "match": ["no_pile", "no_pile_masonry", "no_pile_strips", "no_pile_concrete_floor", "no_pile_slit", "no_pile_bearing_floor"]}, {"color": "#bdbebf", "label": "Stalen paal", "match": ["steel_pile"]}, {"color": "#7192de", "label": "Verzwaarde betonpuntpaal", "match": ["weighted_pile"]}, {"color": "#b271de", "label": "Combinatie", "match": ["combined"]}, {"color": "#ffec33", "label": "Overig", "match": ["other"]}, {"color": "#71decc", "label": "Onbekend", "match": ["unknown"]}]}', 'Funderingstype vastgesteld', 'foundation-type-established'),
            // new MapLayer('e', '{"type": "case_multimatch", "column": "foundation_type", "values": [{"color": "#c75d43", "label": "Houten paal", "match": ["wood", "wood_rotterdam", "wood_amsterdam"]}, {"color": "#deb271", "label": "Houten paal met oplanger", "match": ["wood_charger"]}, {"color": "#6a6c70", "label": "Betonnen paal", "match": ["concrete"]}, {"color": "#ff3333", "label": "Op staal", "match": ["no_pile", "no_pile_masonry", "no_pile_strips", "no_pile_concrete_floor", "no_pile_slit", "no_pile_bearing_floor"]}]}', 'Funderingstype indicatief', 'foundation-type-indicative'),
            new MapLayer('f', '{"type": "case_multimatch", "column": "type", "values": [{"color": "#5cbe55", "label": "Volledig herstel", "match": ["table"]}, {"color": "#47baa5", "label": "Partieel herstel", "match": ["pile_in_wall"]}, {"color": "#8c4bb6", "label": "Paalkop verlaging", "match": ["pile_lowering", "beam_on_pile"]}, {"color": "#c67e70", "label": "Grondverbetering", "match": ["injection"]}, {"color": "#5B4AB7", "label": "Onbekend", "match": ["unknown"]}]}', 'Hersteld', 'foundation-recovery'),
        ]
    },
    {
        id: 3,
        name: 'Schiedam',
        layers: [
            new MapLayer('g', '{"type": "color", "column": "meldingen123kleurtest", "values": {"color": "#d90890"}}', 'Incident', 'incident-schiedam'),
            new MapLayer('h', '{"type": "color", "column": "meldingen123kleurtest", "values": {"color": "#1f0bf9"}}', 'Monitoring', 'monitoring-schiedam'),
            // new MapLayer('i', '{"type": "case", "column": "foundation_risk", "values": [{"color": "#42FF33", "label": "A", "match": "a"}, {"color": "#D1FF33", "label": "B", "match": "b"}, {"color": "#FFEC33", "label": "C", "match": "c"}, {"color": "#FFAC33", "label": "D", "match": "d"}, {"color": "#FF5533", "label": "E", "match": "e"}]}', 'Risico - droogstand', 'drystand-risk'),
            // new MapLayer('j', '{"type": "case", "column": "foundation_risk", "values": [{"color": "#42FF33", "label": "A", "match": "a"}, {"color": "#D1FF33", "label": "B", "match": "b"}, {"color": "#FFEC33", "label": "C", "match": "c"}, {"color": "#FFAC33", "label": "D", "match": "d"}, {"color": "#FF5533", "label": "E", "match": "e"}]}', 'Risico - bacteriele aantasting', 'bio-infection-risk'),
        ]
    },
    // {
    //     id: 4,
    //     name: 'Rapportage',
    //     layers: [
    //         new MapLayer('k', '{"type": "case", "column": "overall_quality", "values": [{"color": "#67B6E4", "label": "Goed", "match": "good"}, {"color": "#4EEBA9", "label": "Redelijk", "match": "tolerable"}, {"color": "#5CF434", "label": "Acceptabel", "match": "mediocre_good"}, {"color": "#FFFF17", "label": "Twijfelachtig", "match": "mediocre"}, {"color": "#DD882F", "label": "Slecht", "match": "mediocre_bad"}, {"color": "#BE4745", "label": "Zeer slecht", "match": "bad"}]}', 'Kwaliteit fundering', 'overall-quality'),
    //         new MapLayer('l', '{"type": "range_num", "column": "enforcement_term", "values": [{"max": "100", "min": "25", "color": "#64DEBC", "label": "> 25"}, {"max": "25", "min": "20", "color": "#55E293", "label": "20 t/m 25"}, {"max": "20", "min": "15", "color": "#46E65F", "label": "15 t/m 20"}, {"max": "15", "min": "10", "color": "#4CEB36", "label": "10 t/m 15"}, {"max": "10", "min": "5", "color": "#77F025", "label": "5 t/m 10"}, {"max": "5", "min": "0", "color": "#AEF614", "label": "0 t/m 5"}, {"max": "0", "min": "-5", "color": "#D0E218", "label": " 0 t/m -5"}, {"max": "-5", "min": "-10", "color": "#CEB31B", "label": "-5 t/m -10"}, {"max": "-10", "min": "-15", "color": "#BB7F1E", "label": "-10 t/m -15"}, {"max": "-15", "min": "-20", "color": "#A85520", "label": "-15 t/m -20"}, {"max": "-20", "min": "-25", "color": "#973321", "label": "-20 t/m -25"}, {"max": "-25", "min": "-100", "color": "#86222A", "label": "< -25"}]}', 'Handhavingstermijn (jaar)', 'enforcement-term'),
    //         new MapLayer('n', '{"type": "case", "column": "type", "values": [{"color": "#B54CB0", "label": "Monitoring", "match": "monitoring"}, {"color": "#8C4BB6", "label": "Notitie", "match": "note"}, {"color": "#5B4AB7", "label": "Snelle scan", "match": "quickscan"}, {"color": "#4969B8", "label": "Sloop onderzoek", "match": "demolition_research"}, {"color": "#489BB9", "label": "Second opinion", "match": "second_opinion"}, {"color": "#47BAA5", "label": "Archief onderzoek", "match": "archieve_research"}, {"color": "#4EBC77", "label": "Architectureel onderzoek", "match": "architectural_research"}, {"color": "#5CBE55", "label": "Funderingsadvies", "match": "foundation_advice"}, {"color": "#8FC05C", "label": "Inspectieput", "match": "inspectionpit"}, {"color": "#BDC262", "label": "Funderingsonderzoek", "match": "foundation_research"}, {"color": "#C4A169", "label": "Extra onderzoek", "match": "additional_research"}, {"color": "#C67E70", "label": "Grondwaterniveau onderzoek", "match": "ground_water_level_research"}, {"color": "#6A6C70", "label": "Onbekend", "match": "unknown"}]}', 'Onderzoekstype', 'inquiry-type'),
    //         new MapLayer('o', '{"type": "case_multimatch", "column": "damage_cause", "values": [{"color": "#55B5A7", "label": "Ontwateringsdiepte", "match": ["drainage"]}, {"color": "#4B8FBF", "label": "Overbelasting", "match": ["overcharge"]}, {"color": "#4145C9", "label": "Bacteriële aantasting", "match": ["bio_fungus_infection", "bio_infection"]}, {"color": "#8936D4", "label": "Schimmelaantasting", "match": ["fungus_infection", "drystand", "bio_fungus_infection"]}, {"color": "#DE2CCF", "label": "Bodemdaling", "match": ["subsidence"]}, {"color": "#D2386F", "label": "Planten en wortels", "match": ["vegetation"]}, {"color": "#C75D43", "label": "Aardbeving", "match": ["gas", "vibrations"]}, {"color": "#BBA14F", "label": "Partieel funderingsherstel", "match": ["partial_foundation_recovery"]}, {"color": "#95B05A", "label": "Constructiefout", "match": ["construction_flaw", "foundation_flaw", "construction_heave"]}, {"color": "#6EA466", "label": "Negatieve kleef", "match": ["negative_cling", "overcharge_negative_cling"]}, {"color": "#6A6C70", "label": "Onbekend", "match": ["unknown"]}]}', 'Schade oorzaak', 'damage-cause'),
    //     ]
    // }
]

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
