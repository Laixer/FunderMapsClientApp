<template>
  <div class="step-2">
    <ProgressSteps :steps="steps" />
    <div class="container step-2__wrapper spacing-bottom">
      <div class="row">
        <div class="col-4">
          <a href="#" @click="handleAddSample()" class="btn btn-add"
            >Adres toevoegen</a
          >
          <div class="SampleCardBar">
            <div v-if="samples.length !== 0" class="">
              <SampleCard
                v-for="(sample, index) in samples"
                :ref="'sample_' + index"
                :key="index + '-' + Date.now()"
                :sample="sample"
                :index="index"
                :editMode="true"
                :class="{
                  active:
                    selectedSample &&
                    ((sample.id != '' && sample.id == selectedSample.id) ||
                      (sample.creationstamp &&
                        sample.creationstamp == selectedSample.creationstamp)),
                }"
                @delete="handleDeleteSample"
                @copy="handleCopySample"
              />
            </div>

            <!-- <b-pagination-nav
              v-if="pageCount > 1"
              v-model="page"
              :number-of-pages="pageCount"
              :link-gen="pageLink"
              align="center"
            /> -->
          </div>
        </div>
        <div class="col-8 px-0">
          <FormSteps
            ref="formSteps"
            v-if="selectedSample"
            :key="selectedSample.id"
          />

          <div v-else>Nog geen adres geselecteerd.</div>

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
      samplesPerPage: 200,
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
    console.log(this.selectedSample);

    if (this.selectedSample && this.selectedSample.stored == false) {
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
    if (from.params.step) {
      var check = await this.$refs.formSteps.next(from.params.step);
      if (check) {
        next();
      }
    } else {
      next();
    }

    // if (from.params.page != to.params.page) {
    //   this.getSamples({
    //     inquiryId: this.activeReport.id,
    //     page: to.params.page || 1,
    //     limit: this.samplesPerPage,
    //   });
    // }
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

      await this.getSampleCount({ inquiryId: this.activeReport.id });
      await this.getSamples({
        inquiryId: this.activeReport.id,
        page: this.page,
        limit: this.samplesPerPage,
      });

      if (this.samples && this.samples[0]) {
        let index = 0;
        if (this.$route.params.sampleId) {
          index = this.samples.findIndex(
            (sample) => sample.id === this.$route.params.sampleId
          );
        }

        this.setSelectedSample(this.samples[index]);
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
      "deleteSample",
    ]),

    handleDeleteSample(sample) {
      this.deleteSample({
        inquiryId: this.activeReport.id,
        sampleId: sample.id,
        creationstamp: sample.creationstamp,
      });
    },

    handleAddSample() {
      this.addUnsavedSample(-1);

      if (this.$route.params.step != 1) {
        this.$router.push({
          name: "edit-report-2",
          params: { page: 1, step: 1 },
        });
      }
    },
    handleCopySample(copyIndex = 0) {
      this.addUnsavedSample(copyIndex);

      if (this.$route.params.step != 1) {
        this.$router.push({
          name: "edit-report-2",
          params: { page: 1, step: 1 },
        });
      }
    },
    pageLink(pageNum) {
      return {
        name: "edit-report-2",
        params: { page: pageNum, step: this.$route.params.step },
      };
    },
  },
};
</script>
