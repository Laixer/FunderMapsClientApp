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
    <InquiryStepOmgeving
      v-model="value"
      :is-active="currentStep === 1"
      :is-completed="currentStep > 1"
      :feedback="feedback"
      @save="save"
      @select="select(1)"
    />
    <InquiryStepFundering
      v-model="value"
      :is-active="currentStep === 2"
      :is-completed="currentStep > 2"
      :feedback="feedback"
      @save="save"
      @select="select(2)"
    />
    <InquiryStepPalenHout
      v-model="value"
      :is-active="currentStep === 3"
      :is-completed="currentStep > 3"
      :feedback="feedback"
      @save="save"
      @select="select(3)"
    />
    <InquiryStepNiveauKwaliteit
      v-model="value"
      :is-active="currentStep === 4"
      :is-completed="currentStep > 4"
      :feedback="feedback"
      @save="save"
      @select="select(4)"
    />
    <InquiryStepScheuren
      v-model="value"
      :is-active="currentStep === 5"
      :is-completed="currentStep > 5"
      :feedback="feedback"
      @save="save"
      @select="select(5)"
    />
    <InquiryStepVervorming
      v-model="value"
      :is-active="currentStep === 6"
      :is-completed="currentStep > 6"
      :feedback="feedback"
      @save="save"
      @select="select(6)"
    />
  </div>
</template>

<script>
import InquiryStepAlgemeen from "molecule/inquiry/steps/InquiryStepAlgemeen";
import InquiryStepOmgeving from "molecule/inquiry/steps/InquiryStepOmgeving";
import InquiryStepFundering from "molecule/inquiry/steps/InquiryStepFundering";
import InquiryStepPalenHout from "molecule/inquiry/steps/InquiryStepPalenHout";
import InquiryStepNiveauKwaliteit from "molecule/inquiry/steps/InquiryStepNiveauKwaliteit";
import InquiryStepScheuren from "molecule/inquiry/steps/InquiryStepScheuren";
import InquiryStepVervorming from "molecule/inquiry/steps/InquiryStepVervorming";

import { isWood } from "config/enums";

import { mapGetters, mapActions } from "vuex";

export default {
  name: "InquirySampleDetailsEditor",
  components: {
    InquiryStepAlgemeen,
    InquiryStepOmgeving,
    InquiryStepFundering,
    InquiryStepPalenHout,
    InquiryStepNiveauKwaliteit,
    InquiryStepScheuren,
    InquiryStepVervorming,
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
      currentStep: 0,
      isDisabled: false,
      feedback: {},
    };
  },
  watch: {
    currentStep(newV) {
      if (newV === 3 && !isWood(this.value.foundationType)) {
        this.currentStep = 4;
      }
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
    isWood,
    ...mapActions("samples", ["updateSample", "createSample", "deleteSample"]),
    ...mapActions("address", ["getAddressById", "getAddressSuggestions"]),
    select(step) {
      if (this.currentStep > step) {
        this.currentStep = step;
      }
    },
    async save({ sample, next }) {
      if (this.currentStep === 6) {
      if (sample.id) {
        await this.updateSample({
          inquiryId: this.activeReport.id,
          sampleId: sample.id,
          data: sample,
        })
          .then(() => {
            this.handleSuccess(next);
          }, this.handleError)
          .catch(this.handleError);
      } else {
        await this.createSample({
          inquiryId: this.activeReport.id,
          data: sample,
        })
          .then(() => {
            this.handleSuccess(next);
          }, this.handleError)
          .catch(this.handleError);
      }
      } else {
        this.handleSuccess(next);
      }
    },
    handleSuccess(next) {
      this.feedback = {};
      if (next) {
        this.currentStep += 1;
      }
    },
    handleError(test) {
      this.feedback = {
        variant: "danger",
        message: "Let op: Het adres is niet opgeslagen. Controleer uw invoer.",
      };
    },
  },
};
</script>
<style lang="scss">
.upload-steps {
  .upload-step:first-child {
    .upload-step-dropdown {
      &::after {
        content: none;
      }
    }
  }

  .upload-step--completed:first-child {
    .upload-step-dropdown {
      &::after {
        content: "";
      }
    }
  }

  .upload-step--completed:last-child {
    .upload-step-dropdown {
      &::after {
        content: none;
      }
    }
  }

  .upload-step-dropdown {
    text-decoration: none;
    cursor: default;
  }

  .upload-step--completed {
    .upload-step-dropdown {
      text-decoration: none;
      cursor: pointer;
    }
  }
}
</style>
