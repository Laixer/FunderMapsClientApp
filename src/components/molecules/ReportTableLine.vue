<template>
  <tr
    class="ReportTableLine d-flex align-items-center p-2 mb-2"
    @click="openReport">
    <td scope="row" class="py-1">
      <div
        :style="{ 'backgroundColor': report.statusColor() }"
        class="ReportTableLine__status mx-auto"></div>
    </td>
    <td class="py-1">
      <strong>{{ report.label() }}</strong>
    </td>
    <td>{{ userObject ? userObject.getUserName() : 'Unknown' }}</td>
    <td>{{ report.date() }}</td>
    <td>
      <TypeTag
        v-if="report.hasType()"
        :type="report.getType()" />
    </td>
    <td class="d-flex justify-content-end">
      <button
        v-if="editable"
        type="button"
        class="btn btn-default"
        @click.stop="handleEdit">
        Bewerk
      </button>
      <button
        v-else
        type="button"
        class="btn btn-default">
        Bekijk
      </button>
    </td>
  </tr>
</template>

<script>
import TypeTag from 'atom/TypeTag';

import { isSuperUser, canWrite } from 'service/auth'

import { mapGetters } from 'vuex'

import ReportModel from 'model/Report'

export default {
  name: 'ReportTableLine',
  components: {
    TypeTag
  },
  props: {
    report: {
      type: ReportModel,
      default: function() {
        return {}
      }
    }
  },
  computed: {
    ...mapGetters('reviewers', [
      'getUserById',
      'areReviewersAvailable'
    ]),
    editable() {
      if (!canWrite()) {
        return false
      }
      return this.report.isEditable();

      // TODO || isSuperUser() was removed. The state machine does not
      // support this functionality.
    },
    userObject() {
      return this.areReviewersAvailable ? this.getUserById({ id: this.report.reviewerId }) : null
    }
  },
  methods: {
    openReport() {
      this.$router.push({
        name: 'view-report',
        params: {
          id: this.report.id,
          document: this.report.documentId
        }
      })
    },
    handleEdit() {
      this.$router.push({
        name: 'edit-report-1',
        params: {
          id: this.report.id,
          document: this.report.documentId
        }
      })
    }
  }
}
</script>

<style lang="scss">
.ReportTableLine {
  background: white;
  border: 1px solid #DFE2E5;
  border-radius: 4px;
  color: #7F8FA4;
  line-height: 1;
  transition: all 0.15s;
  user-select: none;
  cursor: pointer;

  &:hover {
    box-shadow: 0 0 15px 0 rgba(158, 169, 184, 0.7);
    transform: scale(1);
  }

  .badge {
    width: 200px;
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
    color: #7F8FA4;
    width: 100%;

    &:hover, &:active {
      color: darken(#7F8FA4, 10%)
    }
  }
}
</style>
