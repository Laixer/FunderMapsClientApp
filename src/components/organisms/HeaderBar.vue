<template>
  <div v-if="component" class="d-flex align-items-center">
    <component :is="component" />
  </div>
</template>

<script>
import ViewHeader from "molecule/headerbars/View";
import EditReportHeader from "molecule/headerbars/EditReportHeader";

import { mapGetters } from "vuex";

export default {
  name: "HeaderBar",
  components: {
    ViewHeader,
    EditReportHeader,

  },
  computed: {
    ...mapGetters("report", ["activeReport"]),
    component() {
      if (this.$route.name === "view-report") {
        return "ViewHeader";
      }
      if (
        [
          "new-report",
          "edit-report-1",
          "edit-report-2",
          "edit-report-3"
        ].includes(this.$route.name)
      ) {
        return "EditReportHeader";
      }
      return false;
    }
  }
};
</script>
