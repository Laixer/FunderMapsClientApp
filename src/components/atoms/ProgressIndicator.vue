<template>
  <div style="display: contents">
    <div class="ProgressIndicator" :class="statusClass">
      <router-link :to="{ name: to }" class="ProgressIndicator__link">
        <img v-if="iconName" :src="icon(iconName)" />
        <span class="h6 ProgressIndicator__title">{{ title }}</span>
      </router-link>
    </div>
  </div>
</template>

<script>
import { icon } from "helper/assets";

export default {
  name: "ProgressIndicator",
  props: {
    status: {
      type: String,
      default: "disabled",
      validator(value) {
        return ["disabled", "active", "passed"].includes(value);
      },
    },
    clickable: {
      type: Boolean,
      default: false,
    },
    step: {
      type: Number,
      default: 1,
    },
    title: {
      type: String,
      default: "",
    },
    iconName: {
      type: [String, Boolean],
      default: false,
    },
    last: {
      default: false,
    },
    to: {
      default: false,
    },
  },
  computed: {
    statusClass() {
      let cls = {};
      cls["ProgressIndicator--" + this.status] = true;
      return cls;
    },
  },
  methods: {
    icon,
  },
};
</script>

<style lang="scss">
@import "@/assets/scss/variables.scss";
</style>
