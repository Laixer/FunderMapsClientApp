<template>
  <div class="d-flex flex-column">
    <div v-if="areReviewersAvailable">
      <UploadArea />
    </div>
    <ReportTable
      title="Recente rapporten"
      :reports="latestReports({ limit: 5 })"
      class="mt-4 pt-2 mb-5"
    />
    <PrimaryArrowButton
      class="mx-auto"
      label="Alle rapporten"
      :to="{ name: 'reports' }"
    />
  </div>
</template>

<script>
import PrimaryArrowButton from "atom/navigation/PrimaryArrowButton";
import ReportTable from "organism/ReportTable";
import UploadArea from "molecule/UploadArea";

import { mapGetters, mapActions } from "vuex";

let timer = null;

export default {
  name: "Dashboard",
  components: {
    ReportTable,
    UploadArea,
    PrimaryArrowButton,
  },
  computed: {
    ...mapGetters("reports", ["latestReports"]),
    ...mapGetters("reviewers", ["areReviewersAvailable"]),
  },
  async created() {
    try {
      await Promise.all([
        await this.getReports({
          page: 1,
          limit: 25,
        }),
        this.getReviewers(),
        this.getOrganization(),
      ]);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        await this.$router.push({ name: "login" });
      }
    }
  },
  destroyed() {
    clearTimeout(timer);
  },
  methods: {
    ...mapActions("reports", ["getReports"]),
    ...mapActions("reviewers", ["getReviewers"]),
    ...mapActions("org", ["getOrganization"]),
  },
};
</script>
