<template>
  <div class="OverviewItem" v-if="group.show != false">
    <h6 v-if="group.title">{{ group.title }}</h6>

    <div class="row">
      <div
        :class="`col-${group.col}`"
        v-for="(column, index) in group.columns"
        :key="index"
      >
        <component
          v-for="(item, index) in column"
          :is="componentType(item.type ? item.type : null)"
          :key="index"
          :label="item.label"
          :value="item.value"
          :class="item.classes ? item.classes : null"
        />
      </div>
    </div>
  </div>
</template>

<script>
import BasicTextItem from "atom/dataitems/BasicTextItem";
import CheckedImage from "atom/dataitems/CheckedImage";

export default {
  name: "OverviewItem",
  components: {
    BasicTextItem,
    CheckedImage,
  },

  props: {
    group: {
      type: Object,
      default: function () {
        return {};
      },
    },
  },

  data() {
    return {};
  },

  methods: {
    componentType(type) {
      return type === "image" ? "CheckedImage" : "BasicTextItem";
    },
  },
};
</script>
