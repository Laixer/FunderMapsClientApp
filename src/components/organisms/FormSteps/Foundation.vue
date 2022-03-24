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
      <h5 class="FormStep__title">Fundering</h5>

      <span class="FormStepDropdown__indicator">
        <img :src="icon('Angle.svg')" />
      </span>
    </router-link>

    <div class="FormStepForm" v-if="active">
      <Form ref="form" @submit="handleSubmit">
        <Feedback :feedback="feedback" />

        <FormField
          v-model="fields.foundationTypeGroup.value"
          v-bind="fields.foundationTypeGroup"
          @input="handleFoundationChange()"
        />
        <div class="form-row mb-3" v-if="fields.foundationTypeGroup.value">
          <FormField
            v-model="fields.foundationType.value"
            v-bind="fields.foundationType"
            class="col-md-6"
          />
        </div>

        <hr />

        <div class="form-row mb-3">
          <FormField
            v-model="fields.enforcementTerm.value"
            v-bind="fields.enforcementTerm"
            class="col-md-6"
          />

          <FormField
            v-model="fields.damageCharacteristics.value"
            v-bind="fields.damageCharacteristics"
            class="col-md-6"
          />
        </div>

        <div class="form-row mb-3">
          <FormField
            v-model="fields.overallQuality.value"
            v-bind="fields.overallQuality"
            class="col-md-6"
          />

          <FormField
            v-model="fields.damageCause.value"
            v-bind="fields.damageCause"
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

import {
  foundationTypeOptions,
  enforcementTermOptions,
  foundationDamageCauseOptions,
  damageCharacteristicsOptions,
  foundationQualityOptions,
} from "config/enums";
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
      test: foundationTypeOptions,
      fields: {
        foundationTypeGroup: {
          label: "Funderingstype",
          type: "radio-images",
          value: false,
          options: [
            {
              value: "foundation-wooden-poles",
              text: "Houten palen",
              icon: "foundation-wooden-poles.svg",
            },
            {
              value: "foundation-wooden-poles-2",
              text: "Houten palen oplanger",
              icon: "foundation-wooden-poles-2.svg",
            },
            {
              value: "foundation-concrete-poles",
              text: "Betonnen palen",
              icon: "foundation-concrete-poles.svg",
            },
            {
              value: "foundation-none",
              text: "Niet onderheid",
              icon: "foundation-none.svg",
            },
          ],
          validationRules: {},
        },
        foundationType: {
          label: "",
          type: "select",
          value: null,
          options: foundationTypeOptions,
          validationRules: {},
        },
        enforcementTerm: {
          label: "Handhavingstermijn",
          type: "select",
          value: null,
          options: [
            {
              value: null,
              text: "Selecteer een optie",
            },
          ].concat(enforcementTermOptions),
          validationRules: {},
        },
        damageCharacteristics: {
          label: "Geconstateerde schade",
          type: "select",
          value: null,
          options: [
            {
              value: null,
              text: "Selecteer een optie",
            },
          ].concat(damageCharacteristicsOptions),
          validationRules: {},
        },
        overallQuality: {
          label: "Algehele funderingskwaliteit",
          type: "select",
          value: null,
          options: [
            {
              value: null,
              text: "Selecteer een optie",
            },
          ].concat(foundationQualityOptions),
          validationRules: {},
        },
        damageCause: {
          label: "Oorzaak funderingsschade",
          type: "select",
          value: null,
          options: [
            {
              value: null,
              text: "Selecteer een optie",
            },
          ].concat(foundationDamageCauseOptions),
          validationRules: {},
        },
      },
    };
  },

  async created() {
    // Explicitly set the address field.
    this.setFieldValues({
      //   cpt: this.sample.cpt,
      damageCause: this.optionValue({
        options: foundationDamageCauseOptions,
        name: "damageCause",
      }),
      enforcementTerm: this.optionValue({
        options: enforcementTermOptions,
        name: "enforcementTerm",
      }),
      overallQuality: this.optionValue({
        options: foundationQualityOptions,
        name: "overallQuality",
      }),
      damageCharacteristics: this.optionValue({
        options: damageCharacteristicsOptions,
        name: "damageCharacteristics",
      }),
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

    handleFoundationChange() {
      var value = this.fields.foundationTypeGroup.value;

      this.fields.foundationType.value = null;

      if (
        value == "foundation-wooden-poles" ||
        value == "foundation-wooden-poles-2"
      ) {
        this.fields.foundationType.options =
          this.conditionalFoundationTypeOptions("wood");
      } else if (value == "foundation-concrete-poles") {
        this.fields.foundationType.options =
          this.conditionalFoundationTypeOptions("concrete");
      } else {
        this.fields.foundationType.options =
          this.conditionalFoundationTypeOptions("none");
      }
    },

    conditionalFoundationTypeOptions(value) {
      if (value) {
        var filtered = foundationTypeOptions.filter((option) => {
          return option.group == value || option.group == null;
        });

        return filtered;
      } else {
        return foundationTypeOptions;
      }
    },

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
