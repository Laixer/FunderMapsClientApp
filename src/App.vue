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
html,
body {
  height: 100%;
  font-family: "Gibson" !important;
  font-size: 14px;
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
