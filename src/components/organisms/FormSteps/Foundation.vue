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
          class="mb-0"
        />
        <div
          class="form-row"
          v-if="
            fields.foundationTypeGroup.value &&
            fields.foundationTypeGroup.value != 'woodCharger'
          "
        >
          <FormField
            v-model="fields.foundationType.value"
            v-bind="fields.foundationType"
            class="col-md-6 mb-0"
          />
        </div>

        <hr class="mb-4" />

        <div class="form-row">
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

        <div class="form-row">
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
      loaded: false,
      feedback: {},
      fields: {
        foundationTypeGroup: {
          label: "Funderingstype",
          type: "radio-images",
          value: false,
          options: [
            {
              value: "wood",
              text: "Houten palen",
              icon: "foundation-wooden-poles.svg",
            },
            {
              value: "woodCharger",
              text: "Houten palen oplanger",
              icon: "foundation-wooden-poles-2.svg",
            },
            {
              value: "concrete",
              text: "Betonnen palen",
              icon: "foundation-concrete-poles.svg",
            },
            {
              value: "none",
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
          options: [
            {
              value: null,
              text: "Selecteer een optie",
              group: null,
            },
          ].concat(foundationTypeOptions),
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
    // Todo make function
    var selectedFoundationOption = foundationTypeOptions.filter((option) => {
      return option.value == this.sample["foundationType"];
    });

    this.fields.foundationType.options = this.conditionalFoundationTypeOptions(
      selectedFoundationOption[0].group
    );

    this.fields.foundationType.value = this.sample["foundationType"];
    this.fields.foundationTypeGroup.value = selectedFoundationOption[0].group;
    //End todo

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
    next() {
      let step = this.step + 1;

      if ([5, 6, 7, 8, 9].includes(this.fields.foundationType.value)) {
        step = this.step + 2;
      }

      this.$router.push({
        name: "edit-report-2",
        params: {
          page: this.$route.params.page,
          step: step,
          skip: false,
        },
      });
    },

    handleFoundationChange() {
      var value = this.fields.foundationTypeGroup.value;

      this.fields.foundationType.value = null;

      if (value == "wood") {
        this.$emit("showStep4", true);
        this.fields.foundationType.options =
          this.conditionalFoundationTypeOptions("wood");
        this.fields.foundationType.value = 0;
        this.$emit("showStep4", true);
      } else if (value == "woodCharger") {
        this.fields.foundationType.options =
          this.conditionalFoundationTypeOptions("woodCharger");
        this.fields.foundationType.value = 10;
      } else if (value == "concrete") {
        this.$emit("showStep4", true);
        this.fields.foundationType.options =
          this.conditionalFoundationTypeOptions("concrete");
      } else {
        this.$emit("showStep4", false);
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
  },
};
</script>

<style lang="scss">
@import "@/assets/scss/variables.scss";
</style>
