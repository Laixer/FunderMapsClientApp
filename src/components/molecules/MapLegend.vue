<template>
  <div>
    <div class="Legend__title d-flex pl-3 ml-3">
      <span class="align-self-center"> LEGENDA </span>
    </div>
    <div v-if="hasActiveBundle" class="Legend mb-3">
      <div v-for="layer in activeLayers" :key="layer.id">
        <div
          class="Legend__subtitle d-flex pl-3 ml-3 mt-2"
          @click="toggleVisibility(layer)"
        >
          <span class="px-2">
            <img
              :src="
                layer.visibility === 'visible'
                  ? icon('Eye-regular-icon.svg')
                  : icon('Eye-slash-regular-icon.svg')
              "
              width="14"
              height="14"
            />
          </span>
          <span class="align-self-center">
            {{ layer.name }}
          </span>
        </div>
        <div v-if="layer.visibility === 'visible'">
          <ul class="m-0 p-0 pl-3 ml-3 mb-3 list-unstyled">
            <li
              v-for="(item, index) in generateLegend(layer.markup)"
              :key="index"
              class="d-flex my-2 mr-3 align-items-center"
            >
              <span
                class="Legend__point"
                :style="{ backgroundColor: item.color }"
              ></span>
              <span class="Legend__point__label mx-2 flex-grow-1">{{
                item.label
              }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import mapboxgl from "mapbox-gl";
import { mapGetters } from "vuex";
import { icon } from "helper/assets";
import { generateLegend } from "helper/paint";

import {
  // generatePaintStyleFromMarkup,
  generateTooltipForFeature,
} from "helper/paint";

export default {
  methods: {
    generateLegend,
    icon,
    toggleVisibility(layer) {
      layer.visibility = layer.visibility == "visible" ? "none" : "visible";

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
        // this.setPopupFeature(null);
      });
      this.$store.map.on("click", layer.slug, (e) => {
        // this.setPopupFeature(e.features[0]);
        const html = generateTooltipForFeature(layer, e.features[0]);
        new mapboxgl.Popup()
          .setLngLat(e.features[0].geometry.coordinates[0][0])
          .setHTML(html)
          .addTo(this.$store.map);
      });
      this.$forceUpdate();
    },
  },
  computed: {
    ...mapGetters("map", ["hasActiveBundle", "activeBundle", "activeLayers"]),
  },
};
</script>

<style lang="scss">
.Legend {
  border-bottom: 1px solid rgba(0, 0, 0, 0.125);
  height: 100%;
  max-height: 55vh;
  overflow: auto;

  &__title {
    height: 60px;
  }
  &__subtitle {
    height: 30px;
    cursor: pointer;

    span > img {
      margin-top: 8px;
      color: #7f8fa4;
      vertical-align: baseline;
    }
  }
  &__point {
    display: inline-block;
    width: 12px;
    height: 12px;
    margin-left: 20px;
    border-radius: 6px;
  }

  &__point__label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  ul li span:first-child {
    min-width: 20px;
    width: 20px;
  }
  ul li {
    line-height: 1;
  }
}
</style>
