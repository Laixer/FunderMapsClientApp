<template>
  <router-link
    :to="to"
    type="button"
    :disabled="disabled"
    :class="`btn btn-outline-primary btn-lg rounded-pill font-weight-bold d-inline-flex align-items-center${disabled ? ' disabled' : ''}`">
    <img alt="arrow" :src="icon('ArrowLeft-icon.svg')" />
    <span class="mx-4 my-2">{{ label }}</span>
  </router-link>
</template>

<script>

import { icon } from "helper/assets";
export default {
  props: {
    label: {
      type: String,
      default: 'Alle rapporten'
    },
    to: {
      type: Object,
      default: function() {
        return { name: 'reports' }
      }
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    icon
  }
}
</script>

<style lang="scss" scoped>
.btn-outline-primary {
  font-size: 18px;
  font-size: 18px;
  line-height: 1;

  &:hover, &:active, &:focus {
    background: transparent;
    color: darken($picton-blue, 20%);
    border-color: darken($picton-blue, 20%);
  }
}
</style>
