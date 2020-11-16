<template>
  <div v-if="hasActiveBundle" class="Legend mb-3">
    <div class="Legend__title d-flex pl-3 ml-3">
      <span class="align-self-center"> LEGENDA </span>
    </div>
    <div v-for="layer in activeLayers" :key="layer.id">
      <div class="Legend__subtitle d-flex pl-3 ml-3 mt-2">
        <span class="px-2" @click="toggleVisibility(layer)">
          <img
            :src="
              getLayerVisibility(layer)
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
      <div v-if="getLayerVisibility(layer)">
        <ul class="m-0 p-0 pl-3 ml-3 mb-3 list-unstyled">
          <li
            v-for="(item, index) in generateLegendForLayer(layer)"
            :key="index"
            class="d-flex my-2 mr-3 align-items-center"
          >
            <span
              class="Legend__point"
              :style="{ backgroundColor: item.color }"
            ></span>
            <span class="mx-2 flex-grow-1">{{ item.label }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import { icon } from "helper/assets";
import { generateLegend } from "helper/paint";


export default {
  methods: {
    icon,
    toggleVisibility(layer) {
      if (layer.isVisible !== undefined) {
        layer.isVisible = !layer.isVisible;
      } else {
        layer.isVisible = false;
      }
      this.$store.map.setLayoutProperty(
        `${this.activeBundle.id}_${layer.id}`,
        "visibility",
        layer.isVisible ? "visible" : "none"
      );
      this.$forceUpdate();
    },
    getLayerVisibility(layer) {
      return layer.isVisible !== false;
    },
    generateLegendForLayer(layer) {
      return generateLegend(JSON.parse(layer.markup)[0])
    }
  },
  computed: {
    ...mapGetters("map", ["hasActiveBundle", "activeBundle", "activeLayers"]),
  }
};
</script>

<style lang="scss">
.Legend {
  border-bottom: 1px solid rgba(0, 0, 0, 0.125);

  &__title {
    height: 60px;
  }
  &__subtitle {
    height: 30px;

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
  ul li span:first-child {
    width: 20px;
  }
  ul li {
    line-height: 1;
  }
}
</style>
