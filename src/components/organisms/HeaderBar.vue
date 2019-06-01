<template>
  <div v-if="component" class="HeaderBar d-flex align-items-center">
    <component :is="component" />
  </div>
</template>

<script>

import ViewHeader from 'molecule/headerbars/View'

import { mapGetters } from 'vuex'

export default {
  name: 'HeaderBar',
  components: {
    ViewHeader
  },
  computed: {
    ...mapGetters('report', [
      'activeReport'
    ]),
    component() {
      if (this.activeReport) {
        return 'ViewHeader'
      }
      return false;
    }
  }
}
</script>

<style>
.HeaderBar {
  background: white;
  box-shadow: 0 1px 0 0 #CED0DA;
  height: 60px;
}
</style>
