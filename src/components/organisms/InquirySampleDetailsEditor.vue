<template>
  <div class="upload-steps">
    <InquiryStepAlgemeen
      v-model="value"
      :is-active="currentStep === 0"
      :is-completed="currentStep > 0"
      :feedback="feedback"
      @save="save"
      @select="select(0)"
    />
    <InquiryStepAlgemeen
      v-model="value"
      :is-active="currentStep === 1"
      :is-completed="currentStep > 1"
      :feedback="feedback"
      @save="save"
      @select="select(1)"
    />
    <InquiryStepAlgemeen
      v-model="value"
      :is-active="currentStep === 2"
      :is-completed="currentStep > 2"
      :feedback="feedback"
      @save="save"
      @select="select(2)"
    />
    <InquiryStepAlgemeen
      v-model="value"
      :is-active="currentStep === 3"
      :is-completed="currentStep > 3"
      :feedback="feedback"
      @save="save"
      @select="select(3)"
    />
    <InquiryStepAlgemeen
      v-model="value"
      :is-active="currentStep === 4"
      :is-completed="currentStep > 4"
      :feedback="feedback"
      @save="save"
      @select="select(4)"
    />
  </div>
</template>

<script>
import InquiryStepAlgemeen from "molecule/inquiry/steps/InquiryStepAlgemeen";
import { EventBus } from "utils/eventBus.js";

import { mapGetters, mapActions } from "vuex";
import SampleModel from "../../models/Sample";

export default {
  name: "InquirySampleDetailsEditor",
  components: {
    InquiryStepAlgemeen,
    // Divider,
    // Feedback
  },
  props: {
    value: {
      type: Object,
    },
  },
  data() {
    return {
      currentStep: -1,
      isDisabled: false,
      feedback: {},
    };
  },
  watch: {
    currentStep(newV, oldV) {
      console.log(newV, oldV);
    },
    value: {
      handler(newVal, oldVal) {
        if (newVal && oldVal && newVal.id !== oldVal.id) {
          this.currentStep = 0;
        } else if (!oldVal && newVal) {
          this.currentStep = 0;
        } else if (!newVal && oldVal) {
          this.currentStep = -1;
        }
        this.feedback = {};
      },
      deep: true,
    },
  },
  computed: {
    ...mapGetters("report", ["activeReport"]),
  },
  methods: {
    ...mapActions("samples", ["updateSample", "createSample", "deleteSample"]),
    ...mapActions("address", ["getAddressById", "getAddressSuggestions"]),
    select(step) {
      console.log("select")
      if (this.currentStep > step) {
        this.currentStep = step;
      }
    },
    async save({ sample, next }) {
      console.log(sample, next);
      // If any field changes, mark the stored status as false
      if (sample.id) {
        await this.updateSample({
          inquiryId: this.activeReport.id,
          sampleId: sample.id,
          data: sample,
        })
          .then(this.handleSuccess(next))
          .catch(this.handleError);
      } else {
        await this.createSample({
          inquiryId: this.activeReport.id,
          data: sample,
        })
          .then(this.handleSuccess(next))
          .catch(this.handleError);
      }
    },
    handleSuccess(next) {
      this.feedback = {};
      if (next) {
        this.currentStep += 1;
      }
    },
    handleError() {
      this.feedback = {
        variant: "danger",
        message: "Let op: Het adres is niet opgeslagen. Controleer uw invoer.",
      };
    },
  },
};
</script>
