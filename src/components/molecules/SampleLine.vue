<template>
  <div 
    :class="classList"
    class="SampleLine d-flex align-items-center"
    @click="togglePanel">
    <span class="SampleLine__address flex-grow-1">
      {{ address }}
    </span>
    
    <img :src="path" width="10" height="10" />
    
  </div>
</template>

<script>

import { icon } from 'helper/assets'

export default {
  props: {
    address: {
      type: String,
      required: true
    },
    open: {
      type: Boolean,
      required: true
    },
    editMode: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    classList() {
      return {
        'SampleLine--open': !! this.open,
        'SampleLine--edit': !! this.editMode
      }
    },
    path() {
      let name = this.open 
        ? 'ArrowUp-icon.svg' 
        : 'ArrowDown-icon.svg'
      return icon({name});
    }
  },
  methods: {
    icon,
    togglePanel() {
      this.$emit('toggle');
    }
  }
}
</script>

<style lang="scss">
.SampleLine {
  height: 60px;
  padding: 0 30px;
  cursor: pointer;

  &--open &__address {
    font-weight: 600;
  }
}
</style>
