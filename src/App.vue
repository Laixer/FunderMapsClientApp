<template>
  <Layout id="app">
    <router-view />
  </Layout>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import Layout from "./views/layouts/layouts.vue";

@Component({
  components: {
    Layout
  }
})
export default class App extends Vue {}
</script>
<style lang="scss">
@import "~@/sass/common/common";

html,
body {
  height: 100% !important;
  font-family: $font-family-base !important;
  font-size: 14px !important;
  background-color: $aqua-haze !important;

}
html {
  overflow-y: scroll;
}

#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100%;
}
</style>
