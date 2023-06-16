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
    </router-link>

    <div class="FormStepForm" v-if="active">
      <Form ref="form" @submit="handleSubmit">
        <Feedback :feedback="feedback" />

        <div class="form-row">
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

        <div class="form-row">
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

        <div class="form-row">
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

        <div class="form-row">
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

        <span @click="save()" class="btn btn-continue">Opslaan</span>
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
      loaded: false,
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
          label: "Beoordeling lintvoegmeting",
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
          label: "Loodmeting",
          type: "number",
          value: "",
          info: "1:XXX (positief helt naar voren, negatief helt naar achteren)",
          validationRules: {
            decimal,
          },
        },
        skewedParallel: {
          label: "Lintvoegmeting",
          type: "number",
          value: "",
          info: "1:XXX (positief verloopt naar links, negatief verloopt naar rechts)",
          validationRules: {
            decimal,
          },
        },
        thresholdFrontLevel: {
          label: "Drempel voorgevel niveau",
          type: "number",
          value: "",
          info: "m t.o.v. NAP",
          validationRules: {
            decimal,
          },
        },
        thresholdBackLevel: {
          label: "Drempel achtergevel niveau",
          type: "number",
          value: "",
          info: "m t.o.v. NAP",
          validationRules: {
            decimal,
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
          type: "number",
          value: "",
          info: "mm/jaar",
          validationRules: {
            decimal,
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
      thresholdBackLevel: this.sample.thresholdBackLevel,
      skewedWindowFrame: skewedWindowFrame,
      settlementSpeed: this.sample.settlementSpeed,
    });

    this.$nextTick(() => {
      this.loaded = true;
    });
  },

  watch: {
    fields: {
      handler() {
        if (this.loaded) {
          this.sample.stored = false;
        }
      },
      deep: true,
    },
  },

  computed: {
    ...mapGetters("report", ["activeReport"]),
  },

  methods: {
    booleanValue({ name }) {
      return this.sample[name] === true || this.sample[name] === false
        ? this.sample[name]
        : null;
    },
    optionValue({ options, name }) {
      let key = this.sample[name];
      return options[key] ? options[key].value : null;
    },
    handleFoundationBarChange() {},
    async handleSubmit() {
      if (this.isDisabled) {
        return;
      }
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

      this.$emit("stored", data);

      return true;
    },
    save() {
      this.$emit("save");
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
</style>
