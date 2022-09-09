<template>
  <div id="mapContainer">
    <div id="left" class="sidebar flex-center left collapsed">
      <div class="sidebar-content rounded-rect">
        <b>Uitleg Fundermaps</b><br />
        Fundermaps toont u 2 kaarten. Deze zijn via een uitklapmenu rechts
        bovenin te kiezen.<br /><br />

        <b>Funderingskaart</b><br />

        In de laag fundering kunt u van veel locaties het vastgestelde
        funderingstype bekijken. Door op de locatie in de kaart te klikken, ziet
        u aanvullende informatie. Daarnaast zijn alle bij ons bekende (partieel)
        herstelde funderingslocaties in een aparte laag weergegeven.<br /><br />

        <b>Monitoring & Incidentenkaart</b><br />

        Met de tweede kaart krijgt u inzicht op welke locaties er in Schiedam op
        dit moment monitoring en/of herstel van de fundering plaats vindt of
        gaat vinden.<br /><br />

        <b>Zoekfunctie</b><br />

        Op de kaart kunt u rechts bovenin het scherm een adres invoeren.<br /><br />

        <b>2D of 3D weergave</b><br />

        Bij het openen wordt de kaart in 3D weergegeven. Door beide muistoetsen
        in te drukken en de muis omlaag te bewegen, kantelt u de kaart naar een
        plattegrond (2D) weergave.<br /><br />

        <b>Vragen of aanvullingen?</b><br />

        Heeft u vragen, opmerkingen en/of aanvullingen. Neemt u dan contact met
        ons op: info@servicepuntwoningverbetering.nl.

        <div
          class="sidebar-toggle rounded-rect left"
          @click="toggleSidebar('left')"
        >
          <img
            height="28"
            src="https://cdn4.iconfinder.com/data/icons/geomicons/32/672382-expand-512.png"
          />
        </div>
      </div>
    </div>
    <b-modal
      ok-only
      id="modal-disclaimer"
      centered
      okTitle="Akkoord"
      title="Disclaimer"
      >Hoewel de gemeente Schiedam uiterste zorgvuldigheid heeft betracht bij
      het verzamelen, rubriceren en actueel houden van de informatie die via
      deze website wordt aangeboden en ontsloten, staat zij uitdrukkelijk niet
      in voor de juistheid en/of volledigheid en/of actualiteit van de
      informatie.<br /><br />
      Er kunnen aan de informatie die via deze website wordt ontsloten geen
      rechten worden ontleend en de gemeente Schiedam aanvaardt geen
      aansprakelijkheid in verband met de eventuele onjuistheid en/of
      onvolledigheid en/of gedateerdheid van de aangeboden en te raadplegen
      informatie.<br /><br />De gemeente Schiedam wijst er voorts uitdrukkelijk
      op dat bodemgesteldheid en de staat van de bodem en fundering dynamisch
      zijn en wijst de raadpleger van de informatie via deze website erop zo
      nodig zelf nader (bouwkundig) onderzoek te (laten) verrichten.</b-modal
    >
  </div>
</template>

<script>
import mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import { MapLayer } from "@/models/MapLayer";
import { mapGetters, mapMutations } from "vuex";

import { generateTooltipForFeature } from "helper/paint";

const bundles = [
  {
    id: 2,
    name: "Fundering",
    layers: [
      new MapLayer(
        "d",
        '{"type": "case_multimatch", "column": "foundation_type", "values": [{"color": "#c75d43", "label": "Houten paal", "match": ["wood", "weighted_pile", "wood_amsterdam", "wood_rotterdam"]}, {"color": "#deb271", "label": "Houten paal met oplanger", "match": ["wood_charger"]}, {"color": "#6a6c70", "label": "Betonnen paal", "match": ["concrete"]}, {"color": "#ff3333", "label": "Op staal", "match": ["no_pile", "no_pile_masonry", "no_pile_strips", "no_pile_concrete_floor", "no_pile_slit", "no_pile_bearing_floor"]}, {"color": "#bdbebf", "label": "Stalen paal", "match": ["steel_pile"]}, {"color": "#7192de", "label": "Verzwaarde betonpuntpaal", "match": ["weighted_pile"]}, {"color": "#b271de", "label": "Combinatie", "match": ["combined"]}, {"color": "#ffec33", "label": "Overig", "match": ["other"]}, {"color": "#71decc", "label": "Onbekend", "match": ["unknown"]}]}',
        "Funderingstype vastgesteld",
        "foundation-type-established",
        true
      ),
      new MapLayer(
        "f",
        '{"type": "case_multimatch", "column": "type", "values": [{"color": "#5cbe55", "label": "Volledig herstel", "match": ["table"]}, {"color": "#47baa5", "label": "Partieel herstel", "match": ["pile_in_wall"]}, {"color": "#8c4bb6", "label": "Paalkop verlaging", "match": ["pile_lowering", "beam_on_pile"]}, {"color": "#c67e70", "label": "Grondverbetering", "match": ["injection"]}, {"color": "#5B4AB7", "label": "Onbekend", "match": ["unknown"]}]}',
        "Hersteld",
        "foundation-recovery",
        true
      ),
    ],
  },
  {
    id: 3,
    name: "Monitoring & Incident",
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
        for (let layer of this.activeBundle.layers) {
          layer.visibility = "visible";
          this.$store.map.setLayoutProperty(
            layer.slug,
            "visibility",
            layer.visibility
          );
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
      zoom: 14.75,
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

    this.$bvModal.show("modal-disclaimer");

    this.map.on("load", this.onMapLoaded);
  },
  beforeDestroy() {
    this.mapboxIsReady({ status: false });
  },
  methods: {
    ...mapMutations("map", ["mapboxIsReady", "setBundles"]),
    toggleSidebar(id) {
      const elem = document.getElementById(id);
      // Add or remove the 'collapsed' CSS class from the sidebar element.
      // Returns boolean "true" or "false" whether 'collapsed' is in the class list.
      const collapsed = elem.classList.toggle("collapsed");
      const padding = {};
      // 'id' is 'right' or 'left'. When run at start, this object looks like: '{left: 300}';
      padding[id] = collapsed ? 0 : 300; // 0 if collapsed, 300 px if not. This matches the width of the sidebars in the .sidebar CSS class.
      // Use `map.easeTo()` with a padding option to adjust the map's center accounting for the position of sidebars.
      this.$store.map.easeTo({
        padding: padding,
        duration: 1000, // In ms. This matches the CSS transition duration property.
      });
    },
    onMapLoaded(event) {
      this.$store.map = event.target;
      this.mapboxIsReady({ status: true });
      this.toggleSidebar("left");
      for (const bundle of this.mapBundles) {
        for (let layer of bundle.layers) {
          this.$store.map.setLayoutProperty(
            layer.slug,
            "visibility",
            layer.visibility
          );
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

.rounded-rect {
  background: white;
  padding: 10px;
}

.flex-center {
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
}

.flex-center.left {
  left: 0px;
}

.sidebar-content {
  position: absolute;
  width: 100%;
  height: 100%;
}

.sidebar-toggle {
  position: absolute;
  width: 2.6em;
  height: 2.6em;
  overflow: visible;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 4px;
}

.sidebar-toggle.left {
  right: -2.4em;
}

.sidebar-toggle:hover {
  color: #0aa1cf;
  cursor: pointer;
}

.sidebar {
  transition: transform 1s;
  z-index: 1;
  width: 294px;
  height: 100%;
}

.left.collapsed {
  transform: translateX(-295px);
}
</style>
