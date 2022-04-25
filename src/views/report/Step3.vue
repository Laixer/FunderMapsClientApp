<template>
  <div>
    <ProgressSteps :steps="steps" />
    <div class="container">
      <div class="row">
        <div class="col-lg-10 offset-lg-1">
          <div v-if="activeReport" class="Report mt-5 mr-0">
            <!-- <ReportStepHeader :step="3" label="Controle overzicht" /> -->

            <Feedback :feedback="feedback" />

            <ReportDetails
              :activeReport="activeReport"
              :showLastEdited="false"
              :showUsers="true"
            />
            <div v-if="samples.length !== 0" class="Report__samples">
              <SampleDetails
                v-for="(sample, index) in samples"
                :key="index"
                :sample="sample"
              />
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
              Deze rapportage bevat nog geen samples
            </div>
            <div class="text-center mt-4" v-else>
              De addres gegevens worden geladen...
            </div>
          </div>

          <div
            v-if="!activeReport"
            class="d-flex w-100 h-100 align-items-center justify-content-center mt-5"
          >
            <span v-if="!feedback.message">
              Het rapport wordt geladen. We halen het rapport hier opnieuw op om
              te voorkomen dat de controle uitgevoerd wordt op data die niet
              opgeslagen is.
            </span>
            <Feedback :feedback="feedback" />
          </div>

          <!-- <div class="d-flex align-items-center justify-content-center mt-4">
            <BackButton
              :disabled="isDisabled"
              :to="previousStep"
              class="mr-3"
              label="Vorige"
            />
            <PrimaryArrowButton
              :disabled="isDisabled"
              label="Aanbieden ter review"
              @click="handleToPendingReview"
            />
          </div> -->

          <NavigationBar :prev="previousStep" :next="null">
            <button @click="handleToPendingReview" class="btn btn-next">
              Aanbieden ter review
            </button>
          </NavigationBar>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex";

import ProgressStep from "model/ProgressStep";
import ProgressSteps from "molecule/ProgressSteps";
import ReportStepHeader from "atom/ReportStepHeader";
import ReportDetails from "organism/ReportDetails";
import Feedback from "atom/Feedback";
import SampleDetails from "organism/SampleDetails";

import PrimaryArrowButton from "atom/navigation/PrimaryArrowButton";
import BackButton from "atom/navigation/BackButton";

import { canWrite, isSuperUser } from "service/auth";
import { EventBus } from "utils/eventBus.js";

import NavigationBar from "molecule/NavigationBar";

export default {
  components: {
    ReportDetails,
    SampleDetails,
    Feedback,
    ProgressSteps,
    NavigationBar,
  },
  data() {
    return {
      feedback: {},
      nosamples: false,
      page: 1,
      samplesPerPage: 25,
      steps: [
        new ProgressStep({
          status: "passed",
          step: 1,
          icon: "Step-create-icon.svg",
          title: "Rapportinformatie",
          to: "edit-report-1",
        }),
        new ProgressStep({
          status: "passed",
          step: 2,
          icon: "Step-samples-icon.svg",
          title: "Funderingsgegevens",
          to: "edit-report-2",
        }),
        new ProgressStep({
          status: "active",
          step: 3,
          icon: "Step-verify-icon.svg",
          title: "Controle overzicht",
          to: "edit-report-3",
        }),
      ],
    };
  },
  computed: {
    ...mapGetters("report", ["activeReport"]),
    ...mapGetters("samples", ["samples", "sampleCount"]),
    pageCount() {
      return this.sampleCount > 0
        ? Math.ceil(this.sampleCount / this.samplesPerPage)
        : 1;
    },
    isDisabled() {
      return this.activeReport ? !this.activeReport.isPending() : false;
    },
    previousStep() {
      // TODO When is this ever useful?
      let report = this.activeReport
        ? this.activeReport
        : { id: "id", documentName: "documentName" };
      return {
        name: "edit-report-2",
        params: {
          id: report.id,
          fileName: report.fileName,
        },
      };
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

    if (!canWrite()) {
      this.$router.push({
        name: "view-report",
        params: this.$route.params,
      });
      return;
    }

    try {
      await this.getReportById({
        id: this.$route.params.id,
      });

      // TODO This is a fix for the change of format
      if (
        (this.activeReport.isPendingReview() ||
          this.activeReport.isApproved()) &&
        !isSuperUser()
      ) {
        this.$router.push({
          name: "view-report",
          params: this.$route.params,
        });
        return;
      }

      EventBus.$on("save-report", this.handleToPendingReview);

      await this.getSampleCount({ inquiryId: this.activeReport.id });
      await this.getSamples({
        inquiryId: this.activeReport.id,
        page: this.page,
        limit: this.samplesPerPage,
      });
      if (this.sampleCount === 0) {
        this.nosamples = true;
      }
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

    EventBus.$off("save-report", this.handleToPendingReview);
  },
  methods: {
    ...mapActions("report", [
      "getReportById",
      "clearActiveReport",
      "submitForReview",
    ]),
    ...mapActions("samples", ["getSamples", "clearSamples", "getSampleCount"]),
    pageLink(pageNum) {
      return {
        name: "edit-report-3",
        params: { page: pageNum },
      };
    },
    async handleToPendingReview() {
      if (this.activeReport.isPending() === false) {
        this.feedback = {
          variant: "danger",
          message:
            "Er is niets aangepast. Pas eerst uw data aan voordat een review mogelijk is.",
        };
      }

      await this.submitForReview().catch(() => {
        this.feedback = {
          variant: "danger",
          message:
            "De actie kon niet uitgevoerd worden. Probeer het later nog eens.",
        };
      });

      this.$router.push({
        name: "dashboard",
      });
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
h3 {
  font-size: 16px;
  color: #354052;
  font-weight: 600;
}
</style>
