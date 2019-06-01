<template>
  <b-button 
    variant="primary" 
    :to="to"
    :disabled="disabled" 
    class="PrimaryArrowButton font-weight-bold d-inline-flex align-items-center" 
    size="lg" 
    pill>
    <span class="mx-4 my-2">
      {{ label }}
    </span>
    <img 
      alt="arrow" 
      :src="image({ name: 'right-arrow.svg' })" />
  </b-button>
</template>

<script>
// TODO: May later be used as more generic button with arrow image

import { image } from "helper/assets";
export default {
  props: {
    label: {
      type: String,
      default: 'Alle rapporten'
    },
    to: {
      type: Object,
      default: function() {
        return {name: 'reports'}
      }
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    image
  }
}
</script>

<style>
.PrimaryArrowButton {
  font-size: 18px;
  line-height: 1;
}
</style>
