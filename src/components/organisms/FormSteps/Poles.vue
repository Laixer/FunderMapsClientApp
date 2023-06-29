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
      <h5 class="FormStep__title">Palen & Hout</h5>
    </router-link>

    <div class="FormStepForm" v-if="active">
      <Form ref="form" @submit="handleSubmit">
        <Feedback :feedback="feedback" />

        <div class="form-row">
          <FormField
            v-model="fields.pileHeadLevel.value"
            v-bind="fields.pileHeadLevel"
            class="col-md-6"
          />

          <FormField
            v-model="fields.pileTipLevel.value"
            v-bind="fields.pileTipLevel"
            class="col-md-6"
          />
        </div>

        <div class="form-row">
          <FormField
            v-model="fields.pileDiameterTop.value"
            v-bind="fields.pileDiameterTop"
            class="col-md-6"
          />

          <FormField
            v-model="fields.pileDiameterBottom.value"
            v-bind="fields.pileDiameterBottom"
            class="col-md-6"
          />
        </div>

        <div class="form-row">
          <FormField
            v-model="fields.pileDistanceLength.value"
            v-bind="fields.pileDistanceLength"
            class="col-md-6"
          />

          <FormField
            v-model="fields.concreteChargerLength.value"
            v-bind="fields.concreteChargerLength"
            class="col-md-6"
          />
        </div>

        <template v-if="[0, 1, 2, 10, 12, 14].includes(sample.foundationType)">
          <hr />

          <div class="form-row">
            <FormField
              v-model="fields.woodQualityNecessity.value"
              v-bind="fields.woodQualityNecessity"
              @input="handleWoodQualityNecessityChange()"
              class="col-md-6"
            />

            <FormField
              v-if="fields.woodQualityNecessity.value"
              v-model="fields.woodType.value"
              v-bind="fields.woodType"
              class="col-md-6"
            />
          </div>
          <template v-if="fields.woodQualityNecessity.value">
            <div class="form-row">
              <FormField
                v-model="fields.woodPenetrationDepth.value"
                v-bind="fields.woodPenetrationDepth"
                class="col-md-6"
              />

              <FormField
                v-model="fields.woodEncroachement.value"
                v-bind="fields.woodEncroachement"
                class="col-md-6"
              />
            </div>

            <div class="form-row">
              <FormField
                v-model="fields.woodQuality.value"
                v-bind="fields.woodQuality"
                class="col-md-6"
              />

              <FormField
                v-model="fields.carryingCapacityQuality.value"
                v-bind="fields.carryingCapacityQuality"
                class="col-md-6"
              />
            </div>

            <div class="form-row">
              <FormField
                v-model="fields.pileWoodCapacityVerticalQuality.value"
                v-bind="fields.pileWoodCapacityVerticalQuality"
                class="col-md-6"
              />

              <FormField
                v-model="fields.woodCapacityHorizontalQuality.value"
                v-bind="fields.woodCapacityHorizontalQuality"
                class="col-md-6"
              />
            </div>
          </template>
        </template>

        <span @click="next()" class="btn btn-continue">Verder</span>
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

import { woodTypeOptions, qualityOptions, sizeOptions, woodEncroachementOptions } from "config/enums";
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
        pileHeadLevel: {
          label: "Paalkop niveau",
          type: "number",
          value: "",
          validationRules: {
            decimal,
            minValue: minValue(0),
            maxValue: maxValue(999.99),
          },
        },
        pileTipLevel: {
          label: "Paalpunt niveau",
          type: "number",
          value: "",
          validationRules: {
            decimal,
            minValue: minValue(0),
            maxValue: maxValue(999.99),
          },
        },
        pileDiameterTop: {
          label: "Paalkop diameter",
          type: "number",
          value: "",
          info: "mm",
          validationRules: {
            decimal,
            minValue: minValue(0),
            maxValue: maxValue(999.99),
          },
        },
        pileDiameterBottom: {
          label: "Paalpunt diameter",
          type: "number",
          value: "",
          info: "mm",
          validationRules: {
            decimal,
            minValue: minValue(0),
            maxValue: maxValue(999.99),
          },
        },
        pileDistanceLength: {
          label: "Hart-op-hart afstand",
          type: "number",
          value: "",
          info: "m",
          validationRules: {
            decimal,
            minValue: minValue(0),
            maxValue: maxValue(999.99),
          },
        },
        concreteChargerLength: {
          label: "Oplanger lengte",
          type: "number",
          value: "",
          info: "m",
          validationRules: {
            decimal,
            minValue: minValue(0),
            maxValue: maxValue(999.99),
          },
        },
        woodType: {
          label: "Houtsoort",
          type: "radio",
          value: null,
          options: [
            {
              value: 1,
              text: "Vuren",
            },
            {
              value: 0,
              text: "Grenen",
            },
          ],
          validationRules: {},
        },
        woodQualityNecessity: {
          label: "Houtonderzoek",
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
        woodPenetrationDepth: {
          label: "Inslagdiepte",
          type: "number",
          value: "",
          info: "mm",
          validationRules: {
            decimal,
            minValue: minValue(0),
            maxValue: maxValue(999.99),
          },
        },
        woodEncroachement: {
          label: "Hout aantasting",
          type: "select",
          value: null,
          options: [
            {
              value: null,
              text: "Selecteer een optie",
            },
          ].concat(woodEncroachementOptions),
          validationRules: {},
        },
        woodQuality: {
          label: "Houtkwaliteit paal",
          type: "select",
          value: null,
          options: [
            {
              value: null,
              text: "Selecteer een optie",
            },
          ].concat(qualityOptions),
          validationRules: {},
        },
        carryingCapacityQuality: {
          label: "Kwaliteit draagkracht paal",
          type: "select",
          value: null,
          options: [
            {
              value: null,
              text: "Selecteer een optie",
            },
          ].concat(qualityOptions),
          validationRules: {},
        },
        pileWoodCapacityVerticalQuality: {
          label: "Resterende draagkracht paal",
          type: "select",
          value: null,
          options: [
            {
              value: null,
              text: "Selecteer een optie",
            },
          ].concat(sizeOptions),
          validationRules: {},
        },
        woodCapacityHorizontalQuality: {
          label: "Horizontale draagkracht paal",
          type: "select",
          value: null,
          options: [
            {
              value: null,
              text: "Selecteer een optie",
            },
          ].concat(sizeOptions),
          validationRules: {},
        },
      },
    };
  },

  async created() {
    var woodType = this.optionValue({
      options: woodTypeOptions,
      name: "woodType",
    });

    var woodQualityNecessity = this.booleanValue({
      name: "woodQualityNecessity",
    });

    var woodEncroachement = this.optionValue({
      options: woodEncroachementOptions,
      name: "woodEncroachement",
    });

    var woodQuality = this.optionValue({
      options: qualityOptions,
      name: "woodQuality",
    });

    var carryingCapacityQuality = this.optionValue({
      options: qualityOptions,
      name: "carryingCapacityQuality",
    });

    var pileWoodCapacityVerticalQuality = this.optionValue({
      options: sizeOptions,
      name: "pileWoodCapacityVerticalQuality",
    });

    var woodCapacityHorizontalQuality = this.optionValue({
      options: sizeOptions,
      name: "woodCapacityHorizontalQuality",
    });

    // Explicitly set the address field.
    this.setFieldValues({
      pileHeadLevel: this.sample.pileHeadLevel,
      pileTipLevel: this.sample.pileTipLevel,
      pileDiameterTop: this.sample.pileDiameterTop,
      pileDiameterBottom: this.sample.pileDiameterBottom,
      pileDistanceLength: this.sample.pileDistanceLength,
      concreteChargerLength: this.sample.concreteChargerLength,
      woodType: woodType,
      woodQualityNecessity: woodQualityNecessity,
      woodPenetrationDepth: this.sample.woodPenetrationDepth,
      woodEncroachement: woodEncroachement,
      woodQuality: woodQuality,
      carryingCapacityQuality: carryingCapacityQuality,
      pileWoodCapacityVerticalQuality: pileWoodCapacityVerticalQuality,
      woodCapacityHorizontalQuality: woodCapacityHorizontalQuality,
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

    async handleSubmit() {
      if (this.isDisabled) {
        return;
      }

      let data = this.allFieldValues();

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

    handleWoodQualityNecessityChange() {
      let woodQualityNecessity = this.fields.woodQualityNecessity;

      if (woodQualityNecessity && !woodQualityNecessity.value) {
        this.fields.woodType.value = null;
        this.fields.woodPenetrationDepth.value = null;
        this.fields.woodEncroachement.value = null;
        this.fields.woodQuality.value = null;
        this.fields.carryingCapacityQuality.value = null;
        this.fields.pileWoodCapacityVerticalQuality.value = null;
        this.fields.woodCapacityHorizontalQuality.value = null;
      }
    },

    next() {
      this.$router.push({
        name: "edit-report-2",
        params: {
          page: this.$route.params.page,
          step: this.step + 1,
          save: false,
        },
      });
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
