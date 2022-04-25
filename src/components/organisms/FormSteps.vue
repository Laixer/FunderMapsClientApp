<template>
  <div>
    <div class="d-flex justify-content-between">
      <h1 class="h3 FormSteps__title">{{ selectedSample.addressFormatted }}</h1>

      <b-button
        v-if="selectedSample.stored == false"
        size="sm"
        variant="outline-primary"
        class="mr-3"
        @click="save()"
      >
        opslaan
      </b-button>
    </div>
    <div class="FormSteps">
      <Default
        ref="step-1"
        :sample="selectedSample"
        :step="1"
        @stored="handleStored"
        :active="selectedStep == 1"
      />
      <Surrounding
        ref="step-2"
        :sample="selectedSample"
        :step="2"
        @stored="handleStored"
        :active="selectedStep == 2"
      />
      <Foundation
        ref="step-3"
        :sample="selectedSample"
        :step="3"
        @stored="handleStored"
        @showStep4="handleShowStep4"
        :active="selectedStep == 3"
      />

      <Poles
        v-if="showFoundationStep"
        ref="step-4"
        :sample="selectedSample"
        :step="4"
        @stored="handleStored"
        :active="selectedStep == 4"
      />

      <Quality
        ref="step-5"
        :sample="selectedSample"
        :step="5"
        @stored="handleStored"
        :active="selectedStep == 5"
      />
      <Cracks
        ref="step-6"
        :sample="selectedSample"
        :step="6"
        @stored="handleStored"
        :active="selectedStep == 6"
      />

      <Deformation
        ref="step-7"
        :sample="selectedSample"
        :step="7"
        @stored="handleStored"
        @save="save"
        :active="selectedStep == 7"
      />
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex";

import Default from "organism/FormSteps/Default";
import Surrounding from "organism/FormSteps/Surrounding";
import Foundation from "organism/FormSteps/Foundation";
import Poles from "organism/FormSteps/Poles";
import Quality from "./FormSteps/Quality.vue";
import Deformation from "./FormSteps/Deformation.vue";
import Cracks from "./FormSteps/Cracks.vue";

export default {
  components: {
    Default,
    Surrounding,
    Foundation,
    Poles,
    Quality,
    Deformation,
    Cracks,
  },

  async created() {
    this.selectedStep = this.$route.params.step;

    this.$nextTick(() => {
      this.showFoundationStep = this.selectedSample.foundationPiles;
    });
  },

  data() {
    return {
      selectedStep: 1,
      address: null,
      checked: false,
      showFoundationStep: true,
    };
  },

  watch: {
    "$route.params.step": {
      handler: function (step) {
        this.selectedStep = step;
      },
    },
  },

  computed: {
    ...mapGetters("samples", ["selectedSample"]),
    ...mapGetters("report", ["activeReport"]),
  },

  methods: {
    ...mapActions("samples", ["test", "updateSelectedSample", "createSample"]),
    async next(step) {
      if (!this.$refs[`step-${step}`]) {
        return true;
      }
      this.$refs[`step-${step}`].$refs.form.validate();

      if (this.$refs[`step-${step}`].$refs.form.isValid()) {
        return await this.$refs[`step-${step}`].handleSubmit();
      } else {
        return false;
      }
    },

    async save() {
      await this.next(this.selectedStep).then((valid) => {
        if (valid && this.selectedSample.id) {
          this.updateSelectedSample(this.activeReport.id);
          return;
        }

        if (valid) {
          this.createSample({ inquiryId: this.activeReport.id });
        }
      });
    },

    async handleStored(payload) {
      await this.test({
        sampleId: payload.id,
        data: payload,
      });
    },

    handleShowStep4(value) {
      this.showFoundationStep = value;
    },
  },
};
</script>

<style lang="scss">
// @import "@/assets/scss/form-step.scss";
</style>
