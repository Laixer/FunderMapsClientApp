<template>
  <div class="EditHeader p-relative w-100">
    <div class="EditHeader__btns d-flex flex-column align-items-end mr-3">
      <b-button 
        :to="{ name: 'dashboard' }"
        variant="primary" 
        class="font-weight-bold d-flex align-items-center">
        <img :src='icon("Close-icon.svg")' width="11" height="11" /> 
        <span class="ml-1">Sluiten</span>
      </b-button>
      <b-button 
        v-if="activeReport"
        variant="outline-secondary"
        class="SaveBtn mt-2 font-weight-bold d-flex align-items-center"
        @click="handleSaveReport">
        <img :src='icon("Edit-icon.svg")' width="11" height="11" /> 
        <span class="ml-1">Opslaan</span>
      </b-button>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex' 
import { icon } from 'helper/assets'
import { EventBus } from 'utils/eventBus.js'

export default {
  computed: {
    ...mapGetters('report', [
      'activeReport'
    ])
  },
  methods: {
    icon,
    handleSaveReport() {
      EventBus.$emit('save-report')
    }
  }
}
</script>

<style lang="scss">
.EditHeader {
  position: relative;
  z-index: 999;

  &__btns {
    position: absolute;
    top: 12px;
    right: 0;
  }

  .SaveBtn.btn {
    &:hover, &:active {
      background: transparent !important; 
      color: darken(#6c757d, 20%);
      border-color: darken(#6c757d, 20%);
    }
  }
}
</style>
