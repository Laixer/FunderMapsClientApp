<template>
  <div v-if="component" class="navigation d-flex align-items-center">
    <component :is="component" />
  </div>
</template>

<script>
import EditReportNavbar from "molecule/navigationbars/EditReportNavbar";

import { mapGetters } from "vuex";

export default {
  name: "NavigationBar",
  components: {
    EditReportNavbar,

  },
  computed: {
    ...mapGetters("report", ["activeReport"]),
    component() {
      if (
        [
          "new-report",
          "edit-report-1",
          "edit-report-2",
          "edit-report-3"
        ].includes(this.$route.name)
      ) {
        return "EditReportNavbar";
      }
      return false;
    }
  }
};
</script>

<style lang="scss">
.navigation {
  position: sticky;
  padding: 25px 0;
  bottom: 0;
  left: 0;
  width: 100%;
  background-color: $white;
  border-top: 1px solid $mischka;
  z-index: 999;
}
</style>
