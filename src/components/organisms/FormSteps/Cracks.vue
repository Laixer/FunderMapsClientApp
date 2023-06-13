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
      <h5 class="FormStep__title">Scheuren</h5>

      <span class="FormStepDropdown__indicator">
        <img :src="icon('Angle.svg')" />
      </span>
    </router-link>

    <div class="FormStepForm cracks-step" v-if="active">
      <Form ref="form" @submit="handleSubmit">
        <Feedback :feedback="feedback" />

        <div class="form-row">
          <div class="col-3">
            <FormField
              v-model="fields.crackIndoorSizeCheck.value"
              v-bind="fields.crackIndoorSizeCheck"
              class="mb-0"
            />
          </div>

          <div class="col-9" v-show="fields.crackIndoorSizeCheck.value">
            <template>
              <div class="form-row">
                <FormField
                  v-model="fields.crackIndoorRestored.value"
                  v-bind="fields.crackIndoorRestored"
                  class="col-7"
                />
              </div>
              <div class="form-row">
                <FormField
                  v-for="index in fields.crackIndoorSizeAmount.value"
                  :key="index"
                  :label="`Scheur`"
                  v-model="fields.crackIndoorSize.value"
                  v-bind="fields.crackIndoorSize"
                  class="col form-col"
                />
              </div>
            </template>
          </div>
        </div>

        <hr />

        <div class="form-row">
          <div class="col-3">
            <FormField
              v-model="fields.crackFacadeFrontSizeCheck.value"
              v-bind="fields.crackFacadeFrontSizeCheck"
              class="mb-0"
            />
          </div>

          <div class="col-9" v-show="fields.crackFacadeFrontSizeCheck.value">
            <template>
              <div class="form-row">
                <FormField
                  v-model="fields.crackFacadeFrontRestored.value"
                  v-bind="fields.crackFacadeFrontRestored"
                  class="col-7"
                />
              </div>
              <div class="form-row">
                <FormField
                  v-for="index in fields.crackFacadeFrontSizeAmount.value"
                  :key="index"
                  :label="`Scheur`"
                  v-model="fields.crackFacadeFrontSize.value"
                  v-bind="fields.crackFacadeFrontSize"
                  class="col form-col"
                />
              </div>
            </template>
          </div>
        </div>

        <hr />

        <div class="form-row">
          <div class="col-3">
            <FormField
              v-model="fields.crackFacadeBackSizeCheck.value"
              v-bind="fields.crackFacadeBackSizeCheck"
              class="mb-0"
            />
          </div>

          <div class="col-9" v-show="fields.crackFacadeBackSizeCheck.value">
            <template>
              <div class="form-row">
                <FormField
                  v-model="fields.crackFacadeBackRestored.value"
                  v-bind="fields.crackFacadeBackRestored"
                  class="col-7"
                />
              </div>
              <div class="form-row">
                <FormField
                  v-for="index in fields.crackFacadeBackSizeAmount.value"
                  :key="index"
                  :label="`Scheur`"
                  v-model="fields.crackFacadeBackSize.value"
                  v-bind="fields.crackFacadeBackSize"
                  class="col form-col"
                />
              </div>
            </template>
          </div>
        </div>

        <hr />

        <div class="form-row">
          <div class="col-3">
            <FormField
              v-model="fields.crackFacadeLeftSizeCheck.value"
              v-bind="fields.crackFacadeLeftSizeCheck"
              class="mb-0"
            />
          </div>

          <div class="col-9" v-show="fields.crackFacadeLeftSizeCheck.value">
            <template>
              <div class="form-row">
                <FormField
                  v-model="fields.crackFacadeLeftRestored.value"
                  v-bind="fields.crackFacadeLeftRestored"
                  class="col-7"
                />
              </div>
              <div class="form-row">
                <FormField
                  v-for="index in fields.crackFacadeLeftSizeAmount.value"
                  :key="index"
                  :label="`Scheur`"
                  v-model="fields.crackFacadeLeftSize.value"
                  v-bind="fields.crackFacadeLeftSize"
                  class="col form-col"
                />
              </div>
            </template>
          </div>
        </div>

        <hr />

        <div class="form-row">
          <div class="col-3">
            <FormField
              v-model="fields.crackFacadeRightSizeCheck.value"
              v-bind="fields.crackFacadeRightSizeCheck"
            />
          </div>

          <div class="col-9" v-show="fields.crackFacadeRightSizeCheck.value">
            <template>
              <div class="form-row">
                <FormField
                  v-model="fields.crackFacadeRightRestored.value"
                  v-bind="fields.crackFacadeRightRestored"
                  class="col-7"
                />
              </div>
              <div class="form-row">
                <FormField
                  v-for="index in fields.crackFacadeRightSizeAmount.value"
                  :key="index"
                  :label="`Scheur`"
                  v-model="fields.crackFacadeRightSize.value"
                  v-bind="fields.crackFacadeRightSize"
                  class="col form-col"
                />
              </div>
            </template>
          </div>
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
  requiredIf,
} from "vuelidate/lib/validators";

import { crackAmountOptions } from "config/enums";
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
        crackIndoorSizeCheck: {
          label: "Inpandage scheur",
          type: "checkbox",
          value: false,
          image: "crack-indoor.svg",
        },
        crackIndoorSizeAmount: {
          label: "Hoeveel scheuren",
          type: "select",
          value: 1,
          options: [
            {
              value: null,
              text: "Selecteer een optie",
            },
          ].concat(crackAmountOptions),
        },
        crackIndoorRestored: {
          label: "Hersteld 1",
          type: "radio",
          value: false,
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
        },
        crackIndoorSize: {
          type: "number",
          value: null,
          info: "mm",
        },


        crackFacadeFrontSizeCheck: {
          label: "Voorgevel scheur",
          type: "checkbox",
          value: false,
          image: "crack-facade-front.svg",
        },
        crackFacadeFrontSizeAmount: {
          label: "Hoeveel scheuren",
          type: "select",
          value: 1,
          options: [
            {
              value: null,
              text: "Selecteer een optie",
            },
          ].concat(crackAmountOptions),
        },
        crackFacadeFrontRestored: {
          label: "Hersteld",
          type: "radio",
          value: false,
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
        },
        crackFacadeFrontSize: {
          type: "number",
          value: null,
          info: "mm",
        },


        crackFacadeBackSizeCheck: {
          label: "Achtergevel scheur",
          type: "checkbox",
          value: false,
          image: "crack-facade-back.svg",
        },
        crackFacadeBackSizeAmount: {
          label: "Hoeveel scheuren",
          type: "select",
          value: 1,
          options: [
            {
              value: null,
              text: "Selecteer een optie",
            },
          ].concat(crackAmountOptions),
        },
        crackFacadeBackRestored: {
          label: "Hersteld",
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
        },
        crackFacadeBackSize: {
          type: "number",
          value: null,
          info: "mm",
        },

        crackFacadeLeftSizeCheck: {
          label: "Linkergevel scheur",
          type: "checkbox",
          value: false,
          image: "crack-facade-left.svg",
        },
        crackFacadeLeftSizeAmount: {
          label: "Hoeveel scheuren",
          type: "select",
          value: 1,
          options: [
            {
              value: null,
              text: "Selecteer een optie",
            },
          ].concat(crackAmountOptions),
        },
        crackFacadeLeftRestored: {
          label: "Hersteld",
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
        },
        crackFacadeLeftSize: {
          type: "number",
          value: null,
          info: "mm",
        },

        crackFacadeRightSizeCheck: {
          label: "Rechtergevel scheur",
          type: "checkbox",
          value: false,
          image: "crack-facade-right.svg",
        },
        crackFacadeRightSizeAmount: {
          label: "Hoeveel scheuren",
          type: "select",
          value: 1,
          options: [
            {
              value: null,
              text: "Selecteer een optie",
            },
          ].concat(crackAmountOptions),
        },
        crackFacadeRightRestored: {
          label: "Herstelds",
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
        },
        crackFacadeRightSize: {
          type: "number",
          value: null,
          info: "mm",
        },
      },
    };
  },

  async created() {
    // Explicitly set the address field.
    this.setFieldValues({
      crackIndoorSizeCheck: this.sample.crackIndoorSize ? true : false,
      crackIndoorSize: this.sample.crackIndoorSize,
      crackFacadeFrontSizeCheck: this.sample.crackFacadeFrontSize
        ? true
        : false,
      crackFacadeFrontSize: this.sample.crackFacadeFrontSize,
      crackFacadeBackSizeCheck: this.sample.crackFacadeBackSize ? true : false,
      crackFacadeBackSize: this.sample.crackFacadeBackSize,
      crackFacadeLeftSizeCheck: this.sample.crackFacadeLeftSize ? true : false,
      crackFacadeLeftSize: this.sample.crackFacadeLeftSize,
      crackFacadeRightSizeCheck: this.sample.crackFacadeRightSize
        ? true
        : false,
      crackFacadeRightSize: this.sample.crackFacadeRightSize,
      crackIndoorRestored: this.sample.crackIndoorRestored,
      crackFacadeFrontRestored: this.sample.crackFacadeFrontRestored,
      crackFacadeBackRestored: this.sample.crackFacadeBackRestored,
      crackFacadeLeftRestored: this.sample.crackFacadeLeftRestored,
      crackFacadeRightRestored: this.sample.crackFacadeRightRestored,
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

      if (data.crackIndoorSizeCheck == false) {
        data.crackIndoorRestored = null;
        data.crackIndoorSize = null;
      }

      if (data.crackFacadeFrontSizeCheck == false) {
        data.crackFacadeFrontRestored = null;
        data.crackFacadeFrontSize = null;
      }

      if (data.crackFacadeBackSizeCheck == false) {
        data.crackFacadeBackRestored = null;
        data.crackFacadeBackSize = null;
      }

      if (data.crackFacadeLeftSizeCheck == false) {
        data.crackFacadeLeftRestored = null;
        data.crackFacadeLeftSize = null;
      }

      if (data.crackFacadeRightSizeCheck == false) {
        data.crackFacadeRightRestored = null;
        data.crackFacadeRightSize = null;
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

      this.$refs.form.resetValidation();

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

.cracks-wrapper {
  padding: 0 15px;
  width: 100%;

  .form-col {
    padding: 0 5px;
  }
}

// .cracks-step {
//   .form-group {
//     margin-bottom: 0;
//   }
// }
</style>
