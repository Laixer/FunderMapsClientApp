<template>
  <div class="ReportTable">
    <div class="d-flex align-items-end">
      <h2 v-if="hasTitle" class="ml-2 mb-3 d-inline-block">
        {{ title }}
      </h2>
      <div v-if="synchronizing" class="flex-grow-1 d-flex justify-content-end">
        <span class="badge badge-info badge-pill text-uppercase font-weight-bold px-2 py-1">
          Verversen van informatie ...
        </span>
      </div>
    </div>
    <table>
      <thead>
        <tr class="d-flex p-2">
          <th scope="col" class="text-center">
            Status
          </th>
          <th scope="col">
            Documentnaam
          </th>
          <th scope="col">
            Verwerker
          </th>
          <th scope="col">
            Reviewer
          </th>
          <th scope="col" >
            Rapportdatum
          </th>
          <th scope="col">
            Type
          </th>
          <th scope="col"></th>
        </tr>
      </thead>
      <tbody>
        <ReportTableLine
          v-for="(report, index) in reports"
          :key="index"
          :report="report" />
      </tbody>
    </table>
  </div>
</template>

<script>
import ReportTableLine from 'molecule/ReportTableLine';
import { mapActions } from "vuex";

export default {
  name: 'ReportTable',
  components: {
    ReportTableLine
  },
  methods: {
    ...mapActions('orgUsers', ['getUsers']),
  },
  props: {
    title: {
      type: String,
      default: ''
    },
    synchronizing: {
      type: Boolean,
      default: false
    },
    reports: {
      type: Array,
      default: function() {
        return []
      }
    }
  },
  created() {
    this.getUsers();
  },
  computed: {
    hasTitle() {
      return this.title !== ''
    }
  }
}
</script>

<style lang="scss">
.ReportTable {
  width: 100%;
  user-select: none;

  h2 {
    font-size: 18px;
    color: #354052;
    font-weight: 600;
  }
  table {
    width: 100%;

    th {
      color: #7F8FA4;
      font-size: 14px;
      font-weight: normal;
    }
    th, td {
      &:nth-child(1) {
        width: 100px
      }
      &:nth-child(2) {
        min-width: 200px;
        flex-grow: 1;
      }
      &:nth-child(3) {
        width: 150px
      }
      &:nth-child(4) {
        width: 150px
      }
      &:nth-child(5) {
        width: 150px
      }
      &:nth-child(6) {
        // width: 295px
        width: 245px
      }
      &:nth-child(7) {
        // width: 155px
        width: 75px
      }
    }
  }
}

</style>
