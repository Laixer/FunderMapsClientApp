<template>
  <div class="d-flex flex-column">
    <UploadArea />

    <ReportTable 
      title="Recente rapporten"
      :reports="latestReports({ count: 5 })"
      :synchronizing="loading"
      class="mt-4 pt-2 mb-5" />
    <PrimaryArrowButton
      class="mx-auto"
      label="Alle rapporten"
      :to="{ name: 'reports' }" />
  </div>
</template>

<script>
import PrimaryArrowButton from 'atom/navigation/PrimaryArrowButton'
import ReportTable from 'organism/ReportTable';
import UploadArea from 'molecule/UploadArea';

import { mapGetters, mapActions } from 'vuex'

let timer = null;

export default {
  name: 'Dashboard',
  components: {
    ReportTable, UploadArea, PrimaryArrowButton
  },
  data() {
    return {
      loading: true
    }
  },
  computed: {
    ...mapGetters('reports', [
      "latestReports"
    ])
  },
  async created() {
    await Promise.all([
      this.syncReports(),
      this.getReviewers(),
    ])
  },
  destroyed() {
    clearTimeout(timer);
  },
  methods: {
    ...mapActions('reports', [
      'getReports'
    ]),
    ...mapActions('reviewers', [
      'getReviewers'
    ]),

    // Update the report details on the dashboard every minute
    async syncReports() {
      this.loading = true;
      if (timer !== null) {
        clearTimeout(timer);
      }
      await this.getReports({
        page: 1,
        limit: 25,
      });
      this.loading = false;

      timer = setTimeout(this.syncReports, (60 * 1000)); // every minute
    }
  }
}
</script>
