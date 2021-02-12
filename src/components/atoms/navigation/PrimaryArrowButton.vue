<template>
    <router-link
      :to="to"
      type="button"
      :disabled="disabled"
      :event="!disabled ? 'click' : ''"
      :class="`btn btn-primary btn-lg rounded-pill font-weight-bold d-inline-flex align-items-center${disabled ? ' disabled' : ''}`"
      @click="$emit('click')"
  >
      <span class="mx-4 my-2">{{ label }}</span>
      <img v-if="hasIcon" alt="arrow" :src="icon('ArrowRight-icon.svg')" />
    </router-link>
</template>

<script>
import { icon } from "helper/assets";
export default {
  props: {
    label: {
      type: String,
      default: "Alle rapporten"
    },
    to: {
      type: [Object, String],
      default: function() {
        return "";
      }
    },
    disabled: {
      type: Boolean,
      default: false
    },
    hasIcon: {
      type: Boolean,
      default: true
    }
  },
  methods: {
    icon
  }
};
</script>

<style lang="scss" scoped>
.btn-primary {
  font-size: 18px;
  color: white;
  font-size: 18px;
  line-height: 1;

  &:hover, &:active, &:focus {
    color: white;
  }
}
</style>
