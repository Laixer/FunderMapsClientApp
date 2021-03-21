<template>
  <div v-if="component" class="HeaderBar d-flex align-items-center">
    <component :is="component" />
  </div>
</template>

<script>
import ViewHeader from "molecule/headerbars/View";

import { mapGetters } from "vuex";

export default {
  name: "HeaderBar",
  components: {
    ViewHeader,
  },
  computed: {
    ...mapGetters("report", ["activeReport"]),
    component() {
      if (this.$route.name === "view-report") {
        return "ViewHeader";
      }
      return false;
    },
  },
};
</script>

<style>
.HeaderBar {
  width: 100%;
}
</style>
