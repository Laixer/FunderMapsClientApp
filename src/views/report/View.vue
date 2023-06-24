<template>
  <div class="d-flex align-items-start">
    <div v-if="activeReport" class="Report flex-grow-1">
      <ReportDetails
        :activeReport="activeReport"
        :showLastEdited="true"
        :showUsers="false"
      />
      <div v-if="samples.length !== 0" class="Report__samples">
        <SampleDetails
          v-for="(sample, index) in samples"
          :key="index"
          :sample="sample"
        />
        <div class="mb-5" />
        <div class="mb-5" />
        <b-pagination-nav
          v-if="pageCount > 1"
          v-model="page"
          :number-of-pages="pageCount"
          :link-gen="pageLink"
          align="center"
        />
      </div>
      <div v-else-if="nosamples" class="text-center mt-4">
        Deze rapportage bevat nog geen adressen
      </div>
      <div class="text-center mt-4" v-else>
        De addres gegevens worden geladen...
      </div>
    </div>
    <div v-if="activeReport" class="d-flex flex-column">
      <b-button
        variant="primary"
        class="side__btn p-3 font-weight-bold d-flex align-items-center"
        target="_blank"
        @click="getReportDownloadLink"
      >
        <img alt="arrow" :src="icon('Download-icon.svg')" width="17" />
        <span class="ml-2">Download rapport</span>
      </b-button>
      <div class="side p-3 mt-3">
        <h3>Organisaties</h3>
        <ReportOrgRoleExplicit
          :organizationId="activeReport.ownerId"
          organizationRoleOverride="Eigenaar"
        />
        <ReportContractorExplicit
          :organizationId="activeReport.contractorId"
          organizationRoleOverride="Uitvoerder"
        />
      </div>
      <div class="side p-3 mt-3">
        <h3>Betrokken personen</h3>
        <ReportUserRoleExplicit
          :userId="activeReport.creatorId"
          userRoleOverride="Verwerker"
        />
        <ReportUserRoleExplicit
          :userId="activeReport.reviewerId"
          userRoleOverride="Reviewer"
        />
      </div>
    </div>

    <div
      v-if="!activeReport"
      class="d-flex w-100 h-100 align-items-center justify-content-center"
    >
      <span v-if="!feedback.message"> Het rapport wordt geladen... </span>
      <Feedback :feedback="feedback" />
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex";

import ReportDetails from "organism/ReportDetails";
import ReportUserRoleExplicit from "atom/review/ReportUserRoleExplicit";
import ReportOrgRoleExplicit from "atom/review/ReportOrgRoleExplicit";
import ReportContractorExplicit from "atom/review/ReportContractorExplicit";
import Feedback from "atom/Feedback";
import SampleDetails from "organism/SampleDetails";

import { icon } from "helper/assets";
import reportsAPI from "api/reports";
import { isSuperUser, isAdmin } from "service/auth";

export default {
  components: {
    ReportUserRoleExplicit,
    ReportDetails,
    ReportOrgRoleExplicit,
    ReportContractorExplicit,
    SampleDetails,
    Feedback,
  },
  data() {
    return {
      feedback: {},
      nosamples: false,
      page: 1,
      samplesPerPage: 25,
    };
  },
  computed: {
    ...mapGetters("report", ["activeReport"]),
    ...mapGetters("samples", ["samples", "sampleCount"]),
    ...mapGetters("user", ["user"]),
    pageCount() {
      return this.sampleCount > 0
        ? Math.ceil(this.sampleCount / this.samplesPerPage)
        : 1;
    },
  },
  beforeRouteUpdate(to, from, next) {
    this.getSamples({
      inquiryId: this.activeReport.id,
      page: to.params.page || 1,
      limit: this.samplesPerPage,
    });
    next();
  },
  async created() {
    this.page = this.$route.params.page || 1;

    try {
      await this.getReportById({
        id: this.$route.params.id,
      });
      await this.getSampleCount({ inquiryId: this.activeReport.id });
      await this.getSamples({
        inquiryId: this.activeReport.id,
        page: this.page,
        limit: this.samplesPerPage,
      });
      if (this.sampleCount === 0) {
        this.nosamples = true;
      }

      await this.getContractors();
    } catch (err) {
      this.feedback = {
        variant: "danger",
        message: "Het opgevraagde rapport kan niet gevonden worden",
      };
    }
  },
  beforeDestroy() {
    this.clearActiveReport();
    this.clearSamples();
  },
  methods: {
    ...mapActions("report", ["getReportById", "clearActiveReport"]),
    ...mapActions("samples", ["getSamples", "clearSamples", "getSampleCount"]),
    ...mapActions("contractors", ["getContractors"]),
    isAdmin,
    isSuperUser,
    icon,
    pageLink(pageNum) {
      return {
        name: "view-report",
        params: { page: pageNum },
      };
    },
    getReportDownloadLink() {
      try {
        reportsAPI
          .getDownloadLink({
            id: this.activeReport.id,
          })
          .then((response) => {
            if (response.data && response.data.accessLink) {
              window.open(response.data.accessLink);
            } else {
              this.feedback = {
                variant: "danger",
                message:
                  "Het opgevraagde rapport kan op dit moment niet gedownload worden",
              };
            }
          })
          .catch(() => {
            this.feedback = {
              variant: "danger",
              message:
                "Het opgevraagde rapport kan op dit moment niet gedownload worden",
            };
          });
      } catch (err) {
        this.feedback = {
          variant: "danger",
          message:
            "Het opgevraagde rapport kan op dit moment niet gedownload worden",
        };
      }
    },
  },
};
</script>

<style scoped lang="scss">
.Report {
  min-width: 600px;
  max-width: 870px;
  margin-right: 30px;
}
.side {
  width: 360px;
  background: white;
  border: 1px solid #ced0da;
  border-radius: 5px;

  &__btn {
    width: 360px;
    font-size: 16px;
  }
}
h3 {
  font-size: 16px;
  color: #354052;
  font-weight: 600;
}
</style>
