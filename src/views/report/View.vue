<template>
  <div 
    class="d-flex">
    <div v-if="activeReport" class="Report flex-grow-1">
      <div class="Report__details">
        <header class="d-flex align-items-center justify-content-between">
          <div>
            <h3>2017-01-00123-FunderMaps</h3>
            <span>Laatst bewerkt: zondag 14:07 uur</span>
          </div>
          <TypeTag :type="activeReport.getType()" />
        </header>
        <div>

        </div>
        <p>Datum</p>
        <Divider />
        <p>indicatoren</p>
        <Divider />
        <p>notitie</p>
      </div>
      <div class="Report__samples">

      </div>
    </div>
    <div v-if="activeReport" class="side p-3">
      <h3>Gebruikers</h3>
      <ReportUserRole :user="activeReport.creator" />
      <ReportUserRole :user="activeReport.reviewer" />
    </div>

    <div 
      v-if="!activeReport" 
      class="d-flex w-100 h-100 align-items-center justify-content-center">
      <span>Het rapport wordt geladen...</span>
    </div>
  </div>
</template>

<script>

// Get report by id
// Get report samples

import { mapGetters, mapActions } from 'vuex'

import ReportUserRole from 'atom/ReportUserRole'
import TypeTag from 'atom/TypeTag'
import Divider from 'atom/Divider'

export default {
  components: {
    ReportUserRole, TypeTag, Divider
  },
  computed: {
    ...mapGetters('report', [
      'activeReport'
    ]),
    ...mapGetters('samples', [
      'samples'
    ])
  },
  async created() {
    await this.getReportByIds({
      id: this.$route.params.id,
      document: this.$route.params.document
    })
    console.log(this.activeReport)
    await this.getSamples({ reportId: this.activeReport.id })
    console.log(this.samples)
  },
  beforeDestroy() {
    this.clearActiveReport()
    this.clearSamples()
  },
  methods: {
    ...mapActions('report', [
      'getReportByIds',
      'clearActiveReport'
    ]),
    ...mapActions('samples', [
      'getSamples',
      'clearSamples'
    ])
  }
}
</script>

<style scoped lang="scss">
.Report {
  min-width: 600px;
  max-width: 870px;
  margin-right: 30px;

  &__details {
    background: #FAFBFC;
    border-radius: 5px;
    border: 1px solid #CED0DA;
    overflow: hidden;

    header {
      padding: 25px 30px;
      background: white;
      border-bottom: 1px solid #CED0DA;
      width: 100%;
      line-height: 1;

      h3 {
        margin: 0
      }
      span {
        color: #7F8FA4;
        font-size: 12px;
      }
    }
  }
}
.side {
  width: 360px;
  background: white;
  border: 1px solid #CED0DA;
  border-radius: 5px;
}
h3 {
  font-size: 16px;
  color: #354052;
  font-weight: 600;
}
</style>
