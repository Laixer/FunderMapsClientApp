<template>
  <div class="CheckedImage" :class="{ classes: classes }">
    <label class="CheckedImage__inner">
      <img :src="icon(value.icon)" />

      <span class="item-title">{{ value.text }}</span>
      <span class="item-check"></span>
    </label>
  </div>
</template>
<script>
import { icon } from "helper/assets";

export default {
  name: "BasicTextItem",
  data() {
    return {
      icon,
    };
  },
  props: {
    value: {
      type: Object,
    },
    classes: {
      default: null,
    },
  },
};
</script>
