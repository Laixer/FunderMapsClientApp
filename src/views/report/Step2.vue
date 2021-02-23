<template>
  <section class="upload">
    <div class="container">
      <ReportStepHeader :step="2" label="Funderingsgegevens" />

      <div class="upload-row my-4">
        <div class="upload-col-4">
          <a @click="handleAddSample" class="btn btn-add">Adres toevoegen</a>
        </div>
        <div class="upload-col-8">
          <h1 class="h3 address__title">
            {{ selectedSampleAddressFormatted }}
          </h1>
        </div>
      </div>
      <div class="upload-row">
        <div class="upload-col-4 pr-4">
          <div v-if="nosamples" class="text-center mt-4">
            Deze rapportage bevat nog geen adressen
          </div>
          <div v-else-if="samples.length === 0" class="text-center mt-4">
            De adresgegevens worden geladen...
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
          <InquirySampleCardList
            v-else-if="samples.length > 0"
            v-model="activeSample"
            :samples="samples"
            :feedback="feedback"
          />
        </div>
        <div class="upload-col-8">
          <InquirySampleDetailsEditor
            v-if="activeSample"
            v-model="activeSample"
            :activeReport="activeReport"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import Feedback from "atom/Feedback";
import ReportStepHeader from "atom/ReportStepHeader";
import InquirySampleCardList from "organism/InquirySampleCardList";
import InquirySampleDetailsEditor from "organism/InquirySampleDetailsEditor";

import { mapActions, mapGetters } from "vuex";
import { icon } from "helper/assets";
import { isSuperUser, canWrite } from "service/auth";
import { EventBus } from "utils/eventBus.js";

export default {
  name: "Step2",
  components: {
    Feedback,
    InquirySampleCardList,
    InquirySampleDetailsEditor,
    ReportStepHeader,
  },
  data() {
    return {
      feedback: {},
      activeSample: null,
      selectedSampleAddress: null,
      isDisabled: false,
    };
  },
  computed: {
    ...mapGetters("report", ["activeReport"]),
    ...mapGetters("samples", ["samples"]),
    nosamples() {
      return this.samples.length === 0;
    },
    selectedSampleAddressFormatted() {
      return this.selectedSampleAddress
        ? this.selectedSampleAddress.format()
        : this.activeSample
        ? "Nieuw adres"
        : "Selecteer een adres";
    },
  },
  watch: {
    activeSample: {
      async handler(value) {
        if (value && value.address) {
          this.selectedSampleAddress = await this.getAddressById({
            id: value.address,
          });
          return;
        }
        this.selectedSampleAddress = null;
      },
      deep: true,
    },
  },
  async created() {
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
      EventBus.$on("save-report", this.handleSaveSamplesAndNextStep);
      EventBus.$on("add-sample", () => {
        this.addUnsavedSample();
      });
      EventBus.$on("remove-inquiry-sample", (sample) => {
        this.removeSample(sample);
      });

      EventBus.$on("copy-inquiry-sample", (sample) => {
        this.copySample(sample);
      });

      await this.getSamples({ inquiryId: this.activeReport.id });

      if (this.samples.length === 0) {
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
    EventBus.$off("save-report");
    EventBus.$off("select-inquiry-sample");
    EventBus.$off("remove-inquiry-sample");
    EventBus.$off("copy-inquiry-sample");
  },
  methods: {
    icon,
    ...mapActions("address", ["getAddressById"]),
    ...mapActions("report", ["getReportById", "clearActiveReport"]),
    ...mapActions("samples", [
      "getSamples",
      "clearSamples",
      "addUnsavedSample",
      "updateSample",
      "createSample",
      "deleteSample",
    ]),
    async removeSample(sample) {
      const _id = sample.id;
      await this.deleteSample({
        inquiryId: this.activeReport.id,
        sampleId: sample.id,
        creationstamp: sample.creationstamp,
      })
        .then(async () => {
          await this.getSamples({ inquiryId: this.activeReport.id });
          if (this.activeSample) {
            if (this.activeSample.id === _id) {
              this.activeSample = null;
            }
          }
        })
        // TODO: Error
        .catch(() => {
          this.feedback = {
            variant: "danger",
            message: "Het adres kon niet worden verwijderd.",
          };
        });
    },
    copySample(sample) {
      const _sample = Object.assign({}, sample);
      _sample.id = null;
      _sample.address = null;
      this.addUnsavedSample({ data: _sample });
    },
    handleAddSample(data) {
      this.addUnsavedSample({ data });
    },
    async saveAllSamples() {
      return await Promise.all(
        this.samples.map(async (sample, index) => {
          return await this.$refs["sample_" + index][0].save();
        })
      );
    },
    handleSaveSamplesAndNextStep() {
      // TODO Is this in the right place?
      if (this.samples.length === 0) {
        return;
      }

      // For each saved sample we count down via an event handler (this.handleStored). Once this countdown hits 0, we navigate.
      this.countdownToNextPage = this.samples.length;

      // No samples to store
      if (this.countdownToNextPage === 0) {
        this.$router.push(this.nextStep);
      } else {
        this.saveAllSamples();
      }
    },
    /**
     * If we're counting down, and the submit event was a success,
     * count down, until we reach the end and can go to the next page.
     *
     * One mistake and we cancel the countdown.
     */
    handleStored(payload) {
      if (this.countdownToNextPage !== false && payload.success) {
        this.countdownToNextPage = this.countdownToNextPage - 1;
        if (this.countdownToNextPage === 0) {
          this.$router.push(this.nextStep);
        }
      } else if (payload.success === false) {
        this.countdownToNextPage = false;
      }

      if (this.countdownToNewSample !== false && payload.success) {
        this.countdownToNewSample = this.countdownToNewSample - 1;
        if (this.countdownToNewSample === 0) {
          this.addUnsavedSample();
        }
      } else if (payload.success === false) {
        this.countdownToNewSample = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@import "@/sass/common/common";

.address {
  &__title {
    display: flex;
    height: 100%;
    flex-direction: column;
    justify-content: flex-end;
    font-weight: normal;
    font-family: $font-family-base;
    color: $secondary;
  }
}

.btn {
  position: relative;

  &-add {
    font-size: $font-size-small;
    font-family: $headings-font-family;
    border-radius: 3px;
    background-color: $regent-gray;
    color: $white;
    padding: 10px 17px 10px 38px;

    &:hover {
      color: $white;
      background-color: $secondary;
      text-decoration: none;
    }

    &::before {
      content: "";
      position: absolute;
      width: 2px;
      height: 10px;
      left: 19px;
      top: 17px;
      background-color: $white;
    }

    &::after {
      content: "";
      position: absolute;
      width: 10px;
      height: 2px;
      left: 15px;
      top: 21px;
      background-color: $white;
    }
  }
}
</style>
