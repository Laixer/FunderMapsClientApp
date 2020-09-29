<template>
  <div class="d-flex flex-column">
    <div v-if="areReviewersAvailable">
    <UploadArea />
    </div>
    <div v-else>
      <!-- TODO: Show an error page -->
      Geen reviewer beschikbaar - upload wizard niet beschikbaar.
    </div>
    <ReportTable
      title="Recente rapporten"
      :reports="latestReports({ limit: 5 })"
      :synchronizing="loading"
      class="mt-4 pt-2 mb-5"
    />
    <PrimaryArrowButton class="mx-auto" label="Alle rapporten" :to="{ name: 'reports' }" />
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
    PrimaryArrowButton
  },
  data() {
    return {
      loading: true
    };
  },
  computed: {
    ...mapGetters("reports", ["latestReports"]),
    ...mapGetters("reviewers", ["areReviewersAvailable"])
  },
  async created() {
    try {
      await Promise.all([this.syncReports(), this.getReviewers()]);
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

    // Update the report details on the dashboard every minute
    async syncReports() {
      this.loading = true;
      if (timer !== null) {
        clearTimeout(timer);
      }

      await this.getReports({
        page: 1,
        limit: 25
      });

      this.loading = false;

      timer = setTimeout(this.syncReports, 60 * 1000); // every minute
    }
  }
};
</script>
