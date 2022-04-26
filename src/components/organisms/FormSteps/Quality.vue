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

      <span class="FormStepDropdown__indicator">
        <img :src="icon('Angle.svg')" />
      </span>
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

        <div class="form-row">
          <FormField
            v-if="fields.foundationBar.value == 'wood'"
            v-model="fields.woodLevel.value"
            v-bind="fields.woodLevel"
            class="col-md-6"
          />

          <FormField
            v-else-if="fields.foundationBar.value == 'concrete'"
            v-model="fields.constructionPile.value"
            v-bind="fields.constructionPile"
            class="col-md-6"
          />

          <FormField
            v-model="fields.constructionLevel.value"
            v-bind="fields.constructionLevel"
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
          type: "text",
          value: "",
          validationRules: {},
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
          type: "text",
          value: "",
          validationRules: {
            maxLength: maxLength(32),
          },
        },
        constructionPile: {
          label: "Niveau onderkant funderingsbalk",
          type: "text",
          value: "",
          validationRules: {
            maxLength: maxLength(32),
          },
        },

        constructionLevel: {
          label: "Niveau bovenkant funderingsbalk",
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
    var masonQuality = this.optionValue({
      options: qualityOptions,
      name: "masonQuality",
    });

    var foundationBar = null;

    if (this.sample.woodLevel) {
      foundationBar = "wood";
    } else if (this.sample.constructionPile) {
      foundationBar = "concrete";
    }

    // Explicitly set the address field.
    this.setFieldValues({
      masonQuality: masonQuality,
      masonLevel: this.sample.masonLevel,
      woodLevel: this.sample.woodLevel,
      constructionPile: this.sample.constructionPile,
      constructionLevel: this.sample.constructionLevel,
      foundationBar: foundationBar,
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

      //   data.woodLevel = data.woodLevel ? Number(data.woodLevel) : null;

      if (data.foundationBar == "wood") {
        data.woodLevel = data.woodLevel ? Number(data.woodLevel) : null;
        data.constructionPile = null;
      } else if (data.foundationBar == "concrete") {
        data.constructionPile = data.constructionPile
          ? Number(data.constructionPile)
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