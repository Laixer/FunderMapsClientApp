<template>
  <div 
    :class="classList"
    class="SampleLine">
    <div class="SampleLine__header d-flex">
      <span class="SampleLine__address flex-grow-1">
        Straatnaam 123, 1234 AB Plaatsnaam
      </span>
      <span @click="togglePanel">
        T
      </span>
    </div>
    <div 
      v-if="panelVisibility" 
      class="SampleLine__panel">
      <div v-if="editMode">
        Editor panel component
      </div>
      <div v-else>
        Data presentation
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    editMode: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      panelVisibility: false
    }
  },
  computed: {
    classList() {
      return {
        'SampleLine--open': true
      }
    }
  },
  methods: {
    togglePanel() {
      this.panelVisibility = ! this.panelVisibility
    }
  }
}
</script>

<style>

</style>
