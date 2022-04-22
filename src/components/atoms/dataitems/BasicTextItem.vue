<template>
  <p class="OverviewItem__text" :class="{ classes: classes }">
    <span class="OverviewItem__text-label">{{ label }}:</span>
    <span :class="{ 'OverviewItem__text-correct': value === true }">
      {{ boundValue }}</span
    >
  </p>
</template>
<script>
import { isObject } from "helper/is.js";

export default {
  name: "BasicTextItem",
  props: {
    label: {
      type: String,
      required: true,
    },
    value: {
      type: [String, Number, Object, Boolean],
      default: "",
    },
    classes: {
      type: String,
      default: null,
    },
  },
  computed: {
    valueClass() {
      return {
        "text-muted": this.boundValue === "Geen data",
      };
    },
    boundValue() {
      var output;

      if (this.value === true) {
        output = "Ja";
      } else if (this.value === false) {
        output = "Nee";
      } else {
        output =
          isObject(this.value) && this.value.hasOwnProperty("text")
            ? this.value.text
            : this.value;
      }

      return output ? output : "Geen data";
    },
  },
};
</script>
