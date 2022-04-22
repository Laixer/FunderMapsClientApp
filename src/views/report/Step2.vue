<template>
  <div>
    <ProgressSteps :steps="steps" />
    <div class="container mt-5">
      <div class="row">
        <div class="col-4">
          <a href="#" @click="handleAddSample" class="btn btn-add"
            >Adres toevoegen</a
          >
          <div class="SampleCardBar">
            <div v-if="samples.length !== 0" class="">
              <SampleCard
                v-for="(sample, index) in samples"
                :ref="'sample_' + index"
                :key="index + '-' + Date.now()"
                :sample="sample"
                :editMode="true"
                :class="{
                  active: selectedSample && sample.id == selectedSample.id,
                }"
              />
            </div>
          </div>
        </div>
        <div class="col-8 px-0">
          <FormSteps
            ref="formSteps"
            v-if="selectedSample"
            @stored="handleStored"
          />

          <div v-if="activeReport">
            <!-- <div>
              <Feedback :feedback="feedback" />
              <div v-if="samples.length !== 0" class="">
                <Sample
                  v-for="(sample, index) in samples"
                  :ref="'sample_' + index"
                  :key="index + '-' + Date.now()"
                  :sample="sample"
                  :editMode="true"
                  @stored="handleStored"
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
                Deze rapportage bevat nog geen adressen
              </div>
              <div class="text-center mt-4" v-else>
                De addres gegevens worden geladen...
              </div>
            </div> -->
          </div>

          <div
            v-if="!activeReport"
            class="d-flex w-100 h-100 align-items-center justify-content-center mt-5"
          >
            <span v-if="!feedback.message">
              Het rapport wordt geladen. We halen het rapport hier opnieuw op om
              te voorkomen dat er gewerkt wordt met verouderde data.
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
              :disabled="isDisabledNext"
              @click="handleSaveSamplesAndNextStep"
              label="Volgende"
            />
          </div> -->
        </div>
      </div>
    </div>
    <NavigationBar :prev="previousStep" :next="nextStep" />
  </div>
</template>

<script>
import ProgressSteps from "molecule/ProgressSteps";
import ProgressStep from "model/ProgressStep";
import Feedback from "atom/Feedback";
import ReportStepHeader from "atom/ReportStepHeader";
import PrimaryArrowButton from "atom/navigation/PrimaryArrowButton";
import BackButton from "atom/navigation/BackButton";
import Sample from "organism/Sample";
import SampleCard from "organism/SampleCard";
import FormSteps from "organism/FormSteps";
import NavigationBar from "molecule/NavigationBar";

import { mapActions, mapGetters } from "vuex";
import { icon } from "helper/assets";
import { isSuperUser, canWrite } from "service/auth";
import { EventBus } from "utils/eventBus.js";

export default {
  name: "Step2",
  components: {
    Feedback,
    ProgressSteps,
    // ReportStepHeader,
    // PrimaryArrowButton,
    // Sample,
    // BackButton,
    SampleCard,
    FormSteps,
    NavigationBar,
  },
  data() {
    return {
      countdownToNextPage: false,
      countdownToNewSample: false,
      feedback: {},
      nosamples: false,
      isDisabled: false,
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
          status: "active",
          step: 2,
          icon: "Step-samples-icon.svg",
          title: "Funderingsgegevens",
          to: "edit-report-2",
        }),
        new ProgressStep({
          status: "disabled",
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
    ...mapGetters("samples", ["samples", "sampleCount", "selectedSample"]),
    pageCount() {
      return this.sampleCount > 0
        ? Math.ceil(this.sampleCount / this.samplesPerPage)
        : 1;
    },
    previousStep() {
      let report = this.activeReport
        ? this.activeReport
        : { id: "id", documentName: "documentName" };

      return {
        name: "edit-report-1",
        params: {
          id: report.id,
          documentName: report.documentName,
        },
      };
    },
    nextStep() {
      let report = this.activeReport
        ? this.activeReport
        : { id: "id", documentName: "documentName" };

      return {
        name: "edit-report-3",
        params: {
          id: report.id,
          documentName: report.documentName,
        },
      };
    },
    isDisabledNext() {
      return this.samples.length === 0;
    },
  },
  beforeRouteLeave(to, from, next) {
    if (this.selectedSample.stored == false) {
      if (
        confirm(
          "Adres is nog niet opslagen. Weet je zeker dat je de pagina wilt verlaten?"
        ) == true
      ) {
        next();
      }
    } else {
      next();
    }
  },
  async beforeRouteUpdate(to, from, next) {
    if (from.params.step && from.params.skip != true) {
      var check = await this.$refs.formSteps.next(from.params.step);
      if (check) {
        next();
      }
    } else {
      next();
    }

    // this.getSamples({
    //   inquiryId: this.activeReport.id,
    //   page: to.params.page || 1,
    //   limit: this.samplesPerPage,
    // });
  },
  async created() {
    this.page = this.$route.params.page || 1;

    try {
      if (!canWrite()) {
        await this.$router.push({
          name: "view-report",
          params: this.$route.params,
        });
        return;
      }

      await this.getReportById({
        id: this.$route.params.id,
      });

      if (
        (this.activeReport.isPendingReview() ||
          this.activeReport.isApproved()) &&
        !isSuperUser()
      ) {
        await this.$router.push({
          name: "view-report",
          params: this.$route.params,
        });
        return;
      }

      // EventBus.$on("save-report", this.handleSaveSamplesAndNextStep);

      await this.getSampleCount({ inquiryId: this.activeReport.id });
      await this.getSamples({
        inquiryId: this.activeReport.id,
        page: this.page,
        limit: this.samplesPerPage,
      });

      if (this.samples && this.samples[0]) {
        this.setSelectedSample(this.samples[0]);
      } else {
        this.setSelectedSample(null);
      }

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

    //   EventBus.$off("save-report", this.handleSaveSamplesAndNextStep);
  },
  methods: {
    icon,
    ...mapActions("report", ["getReportById", "clearActiveReport"]),
    ...mapActions("samples", [
      "getSamples",
      "getSampleCount",
      "clearSamples",
      "addUnsavedSample",
      "setSelectedSample",
    ]),

    handleAddSample() {
      // this.countdownToNewSample = this.samples.length;
      // if (this.countdownToNewSample === 0) {
      //   this.addUnsavedSample();
      // } else {
      //   this.saveAllSamples();
      // }
      this.addUnsavedSample();
    },
    pageLink(pageNum) {
      return {
        name: "edit-report-2",
        params: { page: pageNum },
      };
    },
    async saveAllSamples() {
      // return await Promise.all(
      //   this.samples.map(async (sample, index) => {
      //     return await this.$refs["sample_" + index][0].save();
      //   })
      // );
    },
    handleSaveSamplesAndNextStep() {
      // // TODO Is this in the right place?
      // if (this.samples.length === 0) {
      //   return;
      // }
      // // For each saved sample we count down via an event handler (this.handleStored). Once this countdown hits 0, we navigate.
      // this.countdownToNextPage = this.samples.length;
      // // No samples to store
      // if (this.countdownToNextPage === 0) {
      //   this.$router.push(this.nextStep);
      // } else {
      //   this.saveAllSamples();
      // }
    },
    /**
     * If we're counting down, and the submit event was a success,
     * count down, until we reach the end and can go to the next page.
     *
     * One mistake and we cancel the countdown.
     */
    handleStored(payload) {
      // if (this.countdownToNextPage !== false && payload.success) {
      //   this.countdownToNextPage = this.countdownToNextPage - 1;
      //   if (this.countdownToNextPage === 0) {
      //     this.$router.push(this.nextStep);
      //   }
      // } else if (payload.success === false) {
      //   this.countdownToNextPage = false;
      // }
      // if (this.countdownToNewSample !== false && payload.success) {
      //   this.countdownToNewSample = this.countdownToNewSample - 1;
      //   if (this.countdownToNewSample === 0) {
      //     this.addUnsavedSample();
      //   }
      // } else if (payload.success === false) {
      //   this.countdownToNewSample = false;
      // }
    },
  },
};
</script>

<style lang="scss">
// @import "@/assets/scss/variables.scss";
</style>
