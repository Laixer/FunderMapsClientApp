<template>
  <tr
    class="ReportTableLine d-flex align-items-center p-2 mb-2"
    @click="openReport"
  >
    <td scope="row">
      <div
        :style="{ backgroundColor: report.statusColor() }"
        class="ReportTableLine__status mx-auto"
      ></div>
    </td>
    <td>
      <strong>{{ report.label() }}</strong>
    </td>
    <td></td>
    <td>{{ ownerUserObject ? ownerUserObject.getUserName() : "-" }}</td>
    <td>{{ reviewerUserObject ? reviewerUserObject.getUserName() : "-" }}</td>
    <td>{{ report.date() }}</td>
    <td>
      <TypeTag v-if="report.hasType()" :type="report.getType()" />
    </td>
    <td class="d-flex justify-content-end">
      <b-button v-if="editable" variant="default" @click.stop="handleEdit">
        Bewerk
      </b-button>
      <b-button v-else variant="default"> Bekijk </b-button>
    </td>
  </tr>
</template>

<script>
import TypeTag from "atom/TypeTag";

import { canWrite } from "service/auth";

import { mapGetters } from "vuex";

import ReportModel from "model/Report";

export default {
  name: "ReportTableLine",
  components: {
    TypeTag,
  },
  props: {
    report: {
      type: ReportModel,
      default: function () {
        return {};
      },
    },
  },
  computed: {
    ...mapGetters("orgUsers", ["getUserById"]),
    editable() {
      if (!canWrite()) {
        return false;
      }
      return this.report.isEditable();

      // TODO || isSuperUser() was removed. The state machine does not
      // support this functionality.
    },
    reviewerUserObject() {
      return this.getUserById({ id: this.report.reviewerId });
    },
    ownerUserObject() {
      return this.getUserById({ id: this.report.creatorId });
    },
  },
  methods: {
    openReport() {
      this.$router.push({
        name: "view-report",
        params: {
          id: this.report.id,
          document: this.report.documentId,
        },
      });
    },
    handleEdit() {
      this.$router.push({
        name: "edit-report-1",
        params: {
          id: this.report.id,
          document: this.report.documentId,
        },
      });
    },
  },
};
</script>

<style lang="scss">
.ReportTableLine {
  width: 100%;
  background: white;
  border: 1px solid #dfe2e5;
  border-radius: 4px;
  color: #7f8fa4;
  line-height: 1;
  transition: all 0.15s;
  user-select: none;
  cursor: pointer;

  &:hover {
    box-shadow: 0 0 15px 0 rgba(158, 169, 184, 0.7);
    transform: scale(1);
  }

  &__status {
    // background: #F5A623;
    width: 20px;
    height: 20px;
    border-radius: 50%;
  }
  strong {
    font-weight: 600;
    color: #354052;
  }

  .btn {
    color: #7f8fa4;

    &:hover,
    &:active {
      color: darken(#7f8fa4, 10%);
    }
  }
}
</style>
