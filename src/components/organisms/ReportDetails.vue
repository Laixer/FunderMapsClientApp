<template>
  <div class="Report__details">
    <header class="d-flex align-items-center justify-content-between">
      <div>
        <h5>
          {{ activeReport.labelShort() }}
        </h5>
        <span v-if="showLastEdited && hasEditedDate">
          Laatst bewerkt: {{ lastEdited }}
        </span>
      </div>
      <TypeTag :type="activeReport.getType()" />
    </header>
    <ReportDate :date="activeReport.documentDate" />
    <Divider />
    <div v-if="showUsers" class="Report__users d-flex">
      <ReportUserRoleExplicit
        :userId="activeReport.creatorId"
        userRoleOverride="Verwerker"
      />
      <ReportUserRoleExplicit
        :userId="activeReport.reviewerId"
        userRoleOverride="Reviewer"
      />
    </div>
    <Divider v-if="showUsers" />
    <div v-if="showUsers" class="Report__users d-flex">
      <ReportContractorExplicit
        :organizationId="activeReport.contractorId"
        organizationRoleOverride="Uitvoerder"
      />
    </div>
    <Divider v-if="showUsers" />

    <div class="container Report__users">
      <div class="row">
        <div class="col-6">
          <table class="report-table">
            <tr>
              <td>Conform F30</td>
              <td>
                <span v-if="activeReport.standardF3o">Ja</span>
                <span v-else>Nee</span>
              </td>
            </tr>

            <tr>
              <td>Onderzoeksput</td>
              <td>
                <span v-if="activeReport.inspection">Ja</span>
                <span v-else>Nee</span>
              </td>
            </tr>
          </table>
        </div>

        <div class="col-6">
          <table class="report-table">
            <tr>
              <td>Lintvoegmeting</td>
              <td>
                <span v-if="activeReport.jointMeasurement">Ja</span>
                <span v-else>Nee</span>
              </td>
            </tr>

            <tr>
              <td>Vloer waterpas</td>
              <td>
                <span v-if="activeReport.floorMeasurement">Ja</span>
                <span v-else>Nee</span>
              </td>
            </tr>
          </table>
        </div>
      </div>
    </div>
    <Divider v-if="activeReport.note" />
    <Note v-if="activeReport.note" :note="activeReport.note" />
  </div>
</template>

<script>
import ReportDate from "atom/review/ReportDate";
import ReportUserRoleExplicit from "atom/review/ReportUserRoleExplicit";
import ReportOrgRoleExplicit from "atom/review/ReportOrgRoleExplicit";
import ReportContractorExplicit from "atom/review/ReportContractorExplicit";
import Note from "atom/review/Note";
import TypeTag from "atom/TypeTag";
import Divider from "atom/Divider";

import { weekDayFromDate, monthYearStringFromDate } from "helper/date";

export default {
  components: {
    TypeTag,
    Divider,
    ReportUserRoleExplicit,
    // ReportOrgRoleExplicit,
    ReportContractorExplicit,
    ReportDate,
    Note,
  },
  props: {
    activeReport: {
      type: Object,
      required: true,
    },
    showLastEdited: {
      type: Boolean,
      default: true,
    },
    showUsers: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    // IN: "2019-04-28T21:55:02.09066+00:00"
    // OUT: vrijdag 30 oktober 2020 - 10:31
    lastEdited() {
      const date = this.activeReport.updateDate;
      return (
        weekDayFromDate({ date }) +
        " " +
        date.getDate() +
        " " +
        monthYearStringFromDate({ date }) +
        " - " +
        date.getHours() +
        ":" +
        date.getMinutes()
      );
    },
    hasEditedDate() {
      return this.activeReport.updateDate !== null;
    },
  },
};
</script>

<style lang="scss">
.Report__details {
  background: #fafbfc;
  border-radius: 5px;
  border: 1px solid #ced0da;
  overflow: hidden;

  .report-table {
    strong {
      margin-left: 15px;
    }
    .report-table-correct {
      color: #29cc8b;
    }
  }

  header {
    padding: 25px 30px;
    background: white;
    border-bottom: 1px solid #ced0da;
    width: 100%;
    line-height: 1;

    h5 {
      margin: 0;
      color: #354052;
      font-weight: 600;
    }
    span {
      color: #7f8fa4;
      font-size: 12px;
    }
  }

  .Report__users {
    padding: 0 30px;

    .ReportUserRole {
      width: 50%;
      margin-top: 0 !important;
    }
  }
  .Report__indicators {
    padding: 0 30px;

    .CheckboxIndicator {
      width: 50%;
    }
    &:last-child {
      margin-bottom: 20px;
    }
  }

  .ReportDate {
    margin-top: 20px;
    padding: 0 30px;
  }
  .Note {
    padding: 0 30px;
    margin-bottom: 20px;
  }
}
</style>
