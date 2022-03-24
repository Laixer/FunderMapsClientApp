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

      <span class="FormStepDropdown__indicator">
        <img :src="icon('Angle.svg')" />
      </span>
    </router-link>

    <div class="FormStepForm" v-if="active">
      <Form ref="form" @submit="handleSubmit">
        <Feedback :feedback="feedback" />

        <div class="form-row mb-3">
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

        <div class="form-row mb-3">
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

        <div class="form-row mb-3">
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

        <hr />

        <div class="form-row mb-3">
          <FormField
            v-model="fields.woodType.value"
            v-bind="fields.woodType"
            class="col-md-6"
          />

          <FormField
            v-model="fields.woodQualityNecessity.value"
            v-bind="fields.woodQualityNecessity"
            class="col-md-6"
          />
        </div>

        <div class="form-row mb-3">
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

        <div class="form-row mb-3">
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

        <div class="form-row mb-3">
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

import { woodTypeOptions, qualityOptions } from "config/enums";
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
        pileHeadLevel: {
          label: "Paalkop niveau",
          type: "text",
          value: "",
          validationRules: {
            maxLength: maxLength(32),
          },
        },
        pileTipLevel: {
          label: "Paalpunt niveau",
          type: "text",
          value: "",
          validationRules: {
            decimal,
          },
        },
        pileDiameterTop: {
          label: "Paalkop diameter",
          type: "text",
          value: "",
          validationRules: {
            maxLength: maxLength(32),
          },
        },
        pileDiameterBottom: {
          label: "Paalpunt diameter",
          type: "text",
          value: "",
          validationRules: {
            maxLength: maxLength(32),
          },
        },

        pileDistanceLength: {
          label: "Hart-op-hart afstand",
          type: "text",
          value: "",
          validationRules: {
            maxLength: maxLength(32),
          },
        },
        concreteChargerLength: {
          label: "Oplanger lengte",
          type: "text",
          value: "",
          validationRules: {
            maxLength: maxLength(32),
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
          type: "text",
          value: "",
          validationRules: {
            maxLength: maxLength(32),
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
          ].concat(qualityOptions),
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
          ].concat(qualityOptions),
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
          ].concat(qualityOptions),
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
      options: qualityOptions,
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
      options: qualityOptions,
      name: "pileWoodCapacityVerticalQuality",
    });

    var woodCapacityHorizontalQuality = this.optionValue({
      options: qualityOptions,
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

    async handleSubmit() {
      if (this.isDisabled) {
        return;
      }
      this.isDisabled = true;
      this.disableAllFields();

      let data = this.allFieldValues();

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
