<template>
  <div
    class="FormStep"
    :class="{
      'FormStep--active': active == 1,
    }"
  >
    <router-link
      :to="{ name: 'edit-report-2', params: { page: 1, step: step } }"
      class="FormStepDropdown"
    >
      <h5 class="FormStep__title">Vervorming</h5>

      <span class="FormStepDropdown__indicator">
        <img :src="icon('Angle.svg')" />
      </span>
    </router-link>

    <div class="FormStepForm" v-if="active">
      <Form ref="form" @submit="handleSubmit">
        <Feedback :feedback="feedback" />

        <div class="form-row mb-3">
          <FormField
            v-model="fields.deformedFacade.value"
            v-bind="fields.deformedFacade"
            class="col-md-6"
          />

          <FormField
            v-model="fields.skewedFacade.value"
            v-bind="fields.skewedFacade"
            class="col-md-6"
          />
        </div>

        <div class="form-row mb-3">
          <FormField
            v-model="fields.skewedPerpendicular.value"
            v-bind="fields.skewedPerpendicular"
            class="col-md-6"
          />

          <FormField
            v-model="fields.skewedParallel.value"
            v-bind="fields.skewedParallel"
            class="col-md-6"
          />
        </div>

        <div class="form-row mb-3">
          <FormField
            v-model="fields.thresholdFrontLevel.value"
            v-bind="fields.thresholdFrontLevel"
            class="col-md-6"
          />

          <FormField
            v-model="fields.thresholdBackLevel.value"
            v-bind="fields.thresholdBackLevel"
            class="col-md-6"
          />
        </div>

        <div class="form-row mb-3">
          <FormField
            v-model="fields.skewedWindowFrame.value"
            v-bind="fields.skewedWindowFrame"
            class="col-md-6"
          />

          <FormField
            v-model="fields.settlementSpeed.value"
            v-bind="fields.settlementSpeed"
            class="col-md-6"
          />
        </div>

        <span @click="save()" class="btn btn-continue"
          >Opslaan &amp; verder</span
        >
      </Form>
    </div>
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

import { rotationOptions } from "config/enums";
import { mapGetters, mapActions } from "vuex";

import Form from "molecule/form/Form";
import FormField from "molecule/form/FormField";
import Feedback from "atom/Feedback";

import fields from "mixin/fields";
import { icon } from "helper/assets";

export default {
  components: {
    Form,
    FormField,
    Feedback,
  },

  mixins: [fields],

  props: {
    sample: {
      type: Object,
      required: true,
    },
    step: {
      type: Number,
      required: true,
    },
    active: {
      type: Boolean,
      required: true,
    },
  },

  data() {
    return {
      icon,
      changed: false,
      feedback: {},
      fields: {
        deformedFacade: {
          label: "Gevel vervormd",
          type: "radio",
          value: null,
          options: [
            {
              value: true,
              text: "Ja",
            },
            {
              value: false,
              text: "Nee",
            },
          ],
          validationRules: {},
        },
        skewedFacade: {
          label: "Scheefstand",
          type: "select",
          value: null,
          options: [
            {
              value: null,
              text: "Selecteer een optie",
            },
          ].concat(rotationOptions),
          validationRules: {},
        },
        skewedPerpendicular: {
          label: "Scheefstand voor naar achter",
          type: "text",
          value: "",
          validationRules: {
            maxLength: maxLength(32),
          },
        },
        skewedParallel: {
          label: "Scheefstand links naar rechts",
          type: "text",
          value: "",
          validationRules: {
            maxLength: maxLength(32),
          },
        },
        thresholdFrontLevel: {
          label: "Drempel voorgevel niveau",
          type: "text",
          value: "",
          validationRules: {
            maxLength: maxLength(32),
          },
        },
        thresholdBackLevel: {
          label: "Drempel achtergevel niveau",
          type: "text",
          value: "",
          validationRules: {
            maxLength: maxLength(32),
          },
        },
        skewedWindowFrame: {
          label: "Scheve deur- en/of raamkozijnen",
          type: "radio",
          value: null,
          options: [
            {
              value: true,
              text: "Ja",
            },
            {
              value: false,
              text: "Nee",
            },
          ],
          validationRules: {},
        },
        settlementSpeed: {
          label: "Pandzakkingssnelheid",
          type: "text",
          value: "",
          validationRules: {
            maxLength: maxLength(32),
          },
        },
      },
    };
  },

  async created() {
    var deformedFacade = this.booleanValue({
      name: "deformedFacade",
    });

    var skewedFacade = this.optionValue({
      options: rotationOptions,
      name: "skewedFacade",
    });

    var skewedWindowFrame = this.booleanValue({
      name: "skewedWindowFrame",
    });

    // Explicitly set the address field.
    this.setFieldValues({
      deformedFacade: deformedFacade,
      skewedFacade: skewedFacade,
      skewedPerpendicular: this.sample.skewedPerpendicular,
      skewedParallel: this.sample.skewedParallel,
      thresholdFrontLevel: this.sample.thresholdFrontLevel,
      thresholdBackLevel: this.sample.constructionLevel,
      skewedWindowFrame: skewedWindowFrame,
      settlementSpeed: this.sample.settlementSpeed,
    });

    this.$nextTick(() => {
      this.changed = false;
    });
  },

  watch: {
    fields: {
      handler() {
        this.changed = true;
      },
      deep: true,
    },
  },

  computed: {
    ...mapGetters("report", ["activeReport"]),
  },

  methods: {
    ...mapActions("samples", ["updateSample", "createSample", "deleteSample"]),

    booleanValue({ name }) {
      return this.sample[name] === true || this.sample[name] === false
        ? this.sample[name]
        : null;
    },
    optionValue({ options, name }) {
      let key = this.sample[name];
      return options[key] ? options[key].value : null;
    },

    save() {
      if (this.changed) {
        this.$refs.form.submit();
      } else {
        this.toNextStep();
      }
    },

    handleFoundationBarChange() {},

    async handleSubmit() {
      if (this.isDisabled) {
        return;
      }
      this.isDisabled = true;
      this.disableAllFields();

      let data = this.allFieldValues();

      data.skewedPerpendicular = data.skewedPerpendicular
        ? Number(data.skewedPerpendicular)
        : null;
      data.skewedParallel = data.skewedParallel
        ? Number(data.skewedParallel)
        : null;
      data.thresholdFrontLevel = data.thresholdFrontLevel
        ? Number(data.thresholdFrontLevel)
        : null;
      data.thresholdBackLevel = data.thresholdBackLevel
        ? Number(data.thresholdBackLevel)
        : null;

      if (this.sample.id) {
        data.id = this.sample.id;
      } else {
        // Used internally, not by the API
        data.creationstamp = this.sample.creationstamp;
      }
      data.address = this.sample.address;
      data.report = this.activeReport.id;

      if (data.id) {
        await this.updateSample({
          inquiryId: this.activeReport.id,
          sampleId: data.id,
          data: data,
        })
          .then(this.handleSuccess)
          .then(() => {
            this.toNextStep();
          })
          .catch(this.handleError);
      } else {
        await this.createSample({
          inquiryId: this.activeReport.id,
          data: data,
        })
          .then(this.handleSuccess)
          .catch(this.handleError);
      }
    },

    toNextStep() {
      this.$router.push({
        name: "edit-report-2",
        params: {
          page: 2,
          step: this.step + 1,
          save: false,
        },
      });
    },

    handleSuccess() {
      try {
        this.feedback = {
          variant: "success",
          message: "De wijzigingen zijn opgeslagen",
        };
        this.enableAllFields();
        this.isDisabled = false;
        this.$refs.form.resetValidation();
        this.changed = false;
      } catch (err) {
        //
      }
    },
    handleError(err) {
      this.feedback = {
        variant: "danger",
        message: "De wijzigingen zijn niet opgeslagen",
      };
      this.enableAllFields();
      this.isDisabled = false;
    },
    handleFormError() {
      this.feedback = {
        variant: "danger",
        message: "Controleer a.u.b. de invoer",
      };
    },
  },
};
</script>

<style lang="scss">
@import "@/assets/scss/variables.scss";
.FormStepForm {
  padding: 30px 40px;
  background-color: $catskill-white;
  border-bottom-left-radius: 5px;
  border-bottom-right-radius: 5px;
}
</style>
