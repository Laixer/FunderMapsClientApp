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

          <div class="col-9">
            <template>
              <div class="form-row">
                <FormField
                  v-show="false"
                  v-model="fields.crackIndoorSizeAmount.value"
                  v-bind="fields.crackIndoorSizeAmount"
                  class="col-5"
                />
                <FormField
                  v-model="fields.crackIndoorRestored.value"
                  v-bind="fields.crackIndoorRestored"
                  class="col-7"
                />
              </div>
              <div class="form-row cracks-wrapper">
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

          <div class="col-9">
            <template>
              <div class="form-row">
                <FormField
                  v-show="false"
                  v-model="fields.crackFacadeFrontSizeAmount.value"
                  v-bind="fields.crackFacadeFrontSizeAmount"
                  class="col-5"
                />
                <FormField
                  v-model="fields.crackFacadeFrontRestored.value"
                  v-bind="fields.crackFacadeFrontRestored"
                  class="col-7"
                />
              </div>
              <div class="form-row cracks-wrapper">
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

          <div class="col-9">
            <template>
              <div class="form-row">
                <FormField
                  v-show="false"
                  v-model="fields.crackFacadeBackSizeAmount.value"
                  v-bind="fields.crackFacadeBackSizeAmount"
                  class="col-5"
                />
                <FormField
                  v-model="fields.crackFacadeBackRestored.value"
                  v-bind="fields.crackFacadeBackRestored"
                  class="col-7"
                />
              </div>
              <div class="form-row cracks-wrapper">
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

          <div class="col-9">
            <template>
              <div class="form-row">
                <FormField
                  v-show="false"
                  v-model="fields.crackFacadeLeftSizeAmount.value"
                  v-bind="fields.crackFacadeLeftSizeAmount"
                  class="col-5"
                />
                <FormField
                  v-model="fields.crackFacadeLeftRestored.value"
                  v-bind="fields.crackFacadeLeftRestored"
                  class="col-7"
                />
              </div>
              <div class="form-row cracks-wrapper">
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

          <div class="col-9">
            <template>
              <div class="form-row">
                <FormField
                  v-show="false"
                  v-model="fields.crackFacadeRightSizeAmount.value"
                  v-bind="fields.crackFacadeRightSizeAmount"
                  class="col-5"
                />
                <FormField
                  v-model="fields.crackFacadeRightRestored.value"
                  v-bind="fields.crackFacadeRightRestored"
                  class="col-7"
                />
              </div>
              <div class="form-row cracks-wrapper">
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
          disabled: true,
          image: "crack-indoor.svg",
          validationRules: {},
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
          validationRules: {},
        },
        crackIndoorRestored: {
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
          validationRules: {},
        },
        crackIndoorSize: {
          type: "text",
          value: null,
          validationRules: {
            maxLength: decimal,
          },
        },
        crackFacadeFrontSizeCheck: {
          label: "Voorgevel scheur",
          type: "checkbox",
          value: false,
          disabled: true,
          image: "crack-facade-front.svg",
          validationRules: {},
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
          validationRules: {},
        },
        crackFacadeFrontRestored: {
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
          validationRules: {},
        },
        crackFacadeFrontSize: {
          type: "text",
          value: null,
          validationRules: {
            maxLength: decimal,
          },
        },
        crackFacadeBackSizeCheck: {
          label: "Achtergevel scheur",
          type: "checkbox",
          value: false,
          disabled: true,
          image: "crack-facade-back.svg",
          validationRules: {},
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
          validationRules: {},
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
          validationRules: {},
        },
        crackFacadeBackSize: {
          type: "text",
          value: null,
          validationRules: {
            maxLength: decimal,
          },
        },

        crackFacadeLeftSizeCheck: {
          label: "Linkergevel scheur",
          type: "checkbox",
          value: false,
          disabled: true,
          image: "crack-facade-left.svg",
          validationRules: {},
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
          validationRules: {},
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
          validationRules: {},
        },
        crackFacadeLeftSize: {
          type: "text",
          value: null,
          validationRules: {
            maxLength: decimal,
          },
        },
        crackFacadeRightSizeCheck: {
          label: "Rechtergevel scheur",
          type: "checkbox",
          value: false,
          disabled: true,
          image: "crack-facade-right.svg",
          validationRules: {},
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
          validationRules: {},
        },
        crackFacadeRightRestored: {
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
          validationRules: {},
        },
        crackFacadeRightSize: {
          type: "text",
          value: null,
          validationRules: {
            maxLength: decimal,
          },
        },
      },
    };
  },

  async created() {
    // Explicitly set the address field.
    this.setFieldValues({
      crackIndoorSize: this.sample.crackIndoorSize,
      crackFacadeFrontSize: this.sample.crackFacadeFrontSize,
      crackFacadeBackSize: this.sample.crackFacadeBackSize,
      crackFacadeLeftSize: this.sample.crackFacadeLeftSize,
      crackFacadeRightSize: this.sample.crackFacadeRightSize,
      crackIndoorRestored: this.sample.crackIndoorRestored,
      crackFacadeFrontRestored: this.sample.crackFacadeFrontRestored,
      crackFacadeBackRestored: this.sample.crackFacadeBackRestored,
      crackFacadeLeftRestored: this.sample.crackFacadeLeftRestored,
      crackFacadeRightRestored: this.sample.crackFacadeRightRestored,
    });

    this.$nextTick(() => {
      this.loaded = false;
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
