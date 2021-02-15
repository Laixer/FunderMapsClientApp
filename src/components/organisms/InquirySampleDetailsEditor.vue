<template>
  <div class="upload-steps">
    <InquiryStepAlgemeen v-model="value" :is-active="currentStep === 0" :is-completed="currentStep > 0" @click.native="select(0)"/>
    <InquiryStepAlgemeen v-model="value" :is-active="currentStep === 1" :is-completed="currentStep > 1" @click.native="select(1)"/>
    <InquiryStepAlgemeen v-model="value" :is-active="currentStep === 2" :is-completed="currentStep > 2" @click.native="select(2)"/>
    <InquiryStepAlgemeen v-model="value" :is-active="currentStep === 3" :is-completed="currentStep > 3" @click.native="select(3)"/>
    <InquiryStepAlgemeen v-model="value" :is-active="currentStep === 4" :is-completed="currentStep > 4" @click.native="select(4)"/>
  </div>
</template>

<script>
import {
  required,
  numeric,
  decimal,
  maxLength,
  minValue,
  maxValue,
} from "vuelidate/lib/validators";
import {
  foundationTypeOptions,
  foundationQualityOptions,
  enforcementTermOptions,
  substructureOptions,
  foundationDamageCauseOptions,
  BaseMeasurementLevelOptions,
} from "config/enums";

import InquiryStepAlgemeen from "molecule/inquiry/steps/InquiryStepAlgemeen";
import { EventBus } from "utils/eventBus.js";

import { mapGetters, mapActions } from "vuex";
import SampleModel from "../../models/Sample";

/**
 * Import API for address from geocoder.
 */
import addressAPI from "api/address";

export default {
  name: "InquirySampleDetailsEditor",
  components: {
    InquiryStepAlgemeen
    // Divider,
    // Feedback
  },
  props: {
    value: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      currentStep: 0,
      isDisabled: false,
      stored: false,
      feedback: {},
    };
  },
  watch: {
    // If any field changes, mark the stored status as false
    fields: {
      handler() {
        this.stored = false;
      },
      deep: true,
    },
  },
  computed: {
    ...mapGetters("report", ["activeReport"]),
  },
  async created() {
    EventBus.$on("next-inquiry-step", () => {this.currentStep++});

    if (this.value.stored === false) {
      this.feedback = {
        variant: "info",
        message: "Let op: Dit adres is nog niet opgeslagen",
      };
    }

    // After setting the field values, set the DB storage status
    this.$nextTick(() => {
      this.stored = this.value.stored !== false;
    });
  },
  methods: {
    ...mapActions("samples", ["updateSample", "createSample", "deleteSample"]),
    ...mapActions("address", ["getAddressById", "getAddressSuggestions"]),
    select(step) {
      if (this.currentStep > step) {
        this.currentStep = step;
      }
    },
    optionValue({ options, name }) {
      let key = this.value[name];
      return options[key] ? options[key].value : null;
    },
    booleanValue({ name }) {
      return this.value[name] === true || this.value[name] === false
        ? this.value[name]
        : null;
    },
    // Called by parent
    async save() {
      if (!this.stored) {
        return await this.$refs.form.submit();
      } else {
        this.$emit("stored", { success: true });
      }
    },
    // Called by parent
    isStored() {
      return this.stored;
    },
    // Called by parent
    delete() {
      if (this.isDisabled) {
        return;
      }
      this.isDisabled = true;
      this.disableAllFields();
      this.feedback = {
        variant: "info",
        message: "Het adres wordt verwijderd...",
      };
      this.deleteSample({
        inquiryId: this.activeReport.id,
        sampleId: this.value.id,
        creationstamp: this.value.creationstamp,
      });
    },
    // Called when we submit our sample.
    async handleSubmit() {
      if (this.isDisabled) {
        return;
      }
      this.isDisabled = true;
      this.disableAllFields();
      this.feedback = {
        variant: "info",
        message: "Het adres wordt opgeslagen...",
      };

      // let data = this.allFieldValues();
      // if (this.sample.id) {
      //   data.id = this.sample.id;
      // } else {
      //   // Used internally, not by the API
      //   data.creationstamp = this.sample.creationstamp;
      // }

      // // required by API
      // if (data.baseMeasurementLevel === null) {
      //   data.baseMeasurementLevel = 0; // NAP
      // }
      // if (data.damageCause === null) {
      //   data.damageCause = 7; // Unknown
      // }
      // if (data.foundationType === null) {
      //   data.foundationType = 15; // Unknown
      // }

      // // Assign address geocoder id from selected field
      // data.address = this.fields.address.selected.id;
      // data.report = this.activeReport.id;

      // // TODO These fields should be mapped automatically
      // data.builtYear = new Date(data.builtYear, 1, 1, 0, 0, 0, 0);
      // data.groundLevel = data.groundLevel ? Number(data.groundLevel) : null;
      // data.groundwaterLevelTemp = data.groundwaterLevelTemp
      //   ? Number(data.groundwaterLevelTemp)
      //   : null;
      // data.woodLevel = data.woodLevel ? Number(data.woodLevel) : null;

      // if (data.id) {
      //   await this.updateSample({
      //     inquiryId: this.activeReport.id,
      //     sampleId: data.id,
      //     data: data,
      //   })
      //     .then(this.handleSuccess)
      //     .catch(this.handleError);
      // } else {
      //   await this.createSample({
      //     inquiryId: this.activeReport.id,
      //     data: data,
      //   })
      //     .then(this.handleSuccess)
      //     .catch(this.handleError);
      // }
    },
    handleSuccess() {
      // try {
      //   this.feedback = {
      //     variant: "success",
      //     message: "De wijzigingen zijn opgeslagen",
      //   };
      //   this.enableAllFields();
      //   this.isDisabled = false;
      //   this.$refs.form.resetValidation();
      //   this.stored = true;

      //   this.$emit("stored", { success: true });
      // } catch (err) {
      //   this.$emit("stored", { success: false, message: err });
      // }
    },
    handleError(err) {
      // this.feedback = {
      //   variant: "danger",
      //   message: "De wijzigingen zijn niet opgeslagen",
      // };
      // this.enableAllFields();
      // this.isDisabled = false;
      // this.$emit("stored", { success: false, message: "Unable to save" });
    },
    handleFormError() {
      // this.feedback = {
      //   variant: "danger",
      //   message: "Controleer a.u.b. de invoer",
      // };
      // this.$emit("stored", { success: false, message: "Invalid input" });
    },
  }
};
</script>
