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
      <h5 class="FormStep__title">Niveau & kwaliteit</h5>
    </router-link>

    <div class="FormStepForm" v-if="active">
      <Form ref="form" @submit="handleSubmit">
        <Feedback :feedback="feedback" />

        <div class="form-row">
          <FormField
            v-model="fields.masonQuality.value"
            v-bind="fields.masonQuality"
            class="col-md-6"
          />

          <FormField
            v-model="fields.masonLevel.value"
            v-bind="fields.masonLevel"
            class="col-md-6"
          />
        </div>

        <hr />

        <div class="form-row">
          <FormField
            v-model="fields.foundationBar.value"
            v-bind="fields.foundationBar"
            class="col-md-6"
          />

          <FormField
            v-model="fields.constructionQuality.value"
            v-bind="fields.constructionQuality"
            class="col-md-6"
          />
        </div>

        <template v-if="fields.foundationBar.value">
          <div class="form-row">
            <FormField v-if="fields.foundationBar.value == 'wood'" v-model="fields.woodLevel.value"
              v-bind="fields.woodLevel" class="col-md-6" />

            <FormField v-else-if="fields.foundationBar.value == 'concrete'" v-model="fields.constructionLevel.value"
              v-bind="fields.constructionLevel" class="col-md-6" />
          </div>
        </template>

        <span @click="next()" class="btn btn-continue">Verder</span>
      </Form>
    </div>
  </div>
</template>

<script>
import {
  decimal,
  maxLength,
  minValue,
  maxValue,
} from "vuelidate/lib/validators";

import { qualityOptions } from "config/enums";
import { mapGetters } from "vuex";

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
        masonQuality: {
          label: "Kwaliteit metselwerk",
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
        masonLevel: {
          label: "Niveau onderkant metselwerk",
          type: "number",
          value: "",
          info: "m t.o.v. NAP",
          validationRules: {
            decimal,
            minValue: minValue(-999.99),
            maxValue: maxValue(999.99),
          },
        },
        foundationBar: {
          label: "Funderingsbalk",
          type: "radio",
          value: null,
          options: [
            {
              value: "wood",
              text: "Hout",
            },
            {
              value: "concrete",
              text: "Beton",
            },
          ],
          validationRules: {},
        },
        constructionQuality: {
          label: "Kwaliteit funderingsbalk",
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
        woodLevel: {
          label: "Niveau onderkant funderingsbalk",
          type: "number",
          value: "",
          info: "m t.o.v. NAP",
          validationRules: {
            decimal,
            minValue: minValue(-999.99),
            maxValue: maxValue(999.99),
          },
        },
        constructionLevel: {
          label: "Niveau onderkant funderingsbalk",
          type: "number",
          value: "",
          validationRules: {
            decimal,
            minValue: minValue(-999.99),
            maxValue: maxValue(999.99),
          },
        },
      },
    };
  },

  async created() {
    var masonQuality = this.optionValue({
      options: qualityOptions,
      name: "masonQuality",
    });

    var constructionQuality = this.optionValue({
      options: qualityOptions,
      name: "constructionQuality",
    });

    var foundationBar = null;

    if (this.sample.woodLevel) {
      foundationBar = "wood";
    } else if (this.sample.constructionLevel) {
      foundationBar = "concrete";
    }
    // Explicitly set the address field.
    this.setFieldValues({
      masonQuality: masonQuality,
      masonLevel: this.sample.masonLevel,
      woodLevel: this.sample.woodLevel,
      constructionLevel: this.sample.constructionLevel,
      foundationBar: foundationBar,
      constructionQuality: constructionQuality,
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

      if (data.foundationBar == "wood") {
        data.woodLevel = data.woodLevel ? Number(data.woodLevel) : null;
        data.constructionLevel = null;
      } else if (data.foundationBar == "concrete") {
        data.constructionLevel = data.constructionLevel
          ? Number(data.constructionLevel)
          : null;
        data.woodLevel = null;
      }

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
