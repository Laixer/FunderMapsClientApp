<template>
  <div>
    <ReportTable
      title="Alle rapporten"
      :reports="reports"
      class="mt-4 pt-2 mb-5"
    />
    <b-pagination-nav
      v-if="pageCount > 1"
      v-model="page"
      :number-of-pages="pageCount"
      :link-gen="pageLink"
      align="center"
    />
  </div>
</template>

<script>
import ReportTable from "organism/ReportTable";

import { mapGetters, mapActions } from "vuex";

export default {
  components: {
    ReportTable,
  },
  data() {
    return {
      page: 1,
      reportsPerPage: 5, // TODO: set to higher number...
    };
  },
  computed: {
    ...mapGetters("reports", ["reportCount", "reports"]),
    pageCount() {
      return this.reportCount > 0
        ? Math.ceil(this.reportCount / this.reportsPerPage)
        : 1;
    },
  },
  beforeRouteUpdate(to, from, next) {
    this.getReports({
      page: to.params.page || 1,
      limit: this.reportsPerPage,
    });
    next();
  },
  async created() {
    this.page = this.$route.params.page || 1;

    try {
      // Always perform a report count update when loading this page
      await Promise.all([
        this.getReviewers(),
        this.getReports({
          page: this.page,
          limit: this.reportsPerPage,
        }),
        this.getReportCount(),
      ]);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        this.$router.push({ name: "login" });
      }
    }
  },
  methods: {
    ...mapActions("reports", ["getReports", "getReportCount"]),
    ...mapActions("reviewers", ["getReviewers"]),
    pageLink(pageNum) {
      return {
        name: "reports",
        params: { page: pageNum },
      };
    },
  },
};
</script>

