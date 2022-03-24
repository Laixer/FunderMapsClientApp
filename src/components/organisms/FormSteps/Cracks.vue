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

          <div class="col-9 pl-4">
            <template>
              <div class="form-row">
                <FormField
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
                  :label="`Scheur ${index}`"
                  v-model="fields.crackIndoorSize.value[index - 1]"
                  v-bind="fields.crackIndoorSize"
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

          <div class="col-9 pl-4">
            <template>
              <div class="form-row">
                <FormField
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
                  :label="`Scheur ${index}`"
                  v-model="fields.crackFacadeFrontSize.value[index - 1]"
                  v-bind="fields.crackFacadeFrontSize"
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

          <div class="col-9 pl-4">
            <template>
              <div class="form-row">
                <FormField
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
                  :label="`Scheur ${index}`"
                  v-model="fields.crackFacadeBackSize.value[index - 1]"
                  v-bind="fields.crackFacadeBackSize"
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

          <div class="col-9 pl-4">
            <template>
              <div class="form-row">
                <FormField
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
                  :label="`Scheur ${index}`"
                  v-model="fields.crackFacadeLeftSize.value[index - 1]"
                  v-bind="fields.crackFacadeLeftSize"
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

          <div class="col-9 pl-4">
            <template>
              <div class="form-row">
                <FormField
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
                  :label="`Scheur ${index}`"
                  v-model="fields.crackFacadeRightSize.value[index - 1]"
                  v-bind="fields.crackFacadeRightSize"
                />
              </div>
            </template>
          </div>
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
      changed: false,
      feedback: {},
      fields: {
        crackIndoorSizeCheck: {
          label: "Inpandage scheur",
          type: "checkbox",
          value: true,
          image: "crack-indoor.svg",
          validationRules: {},
        },
        crackIndoorSizeAmount: {
          label: "Hoeveel scheuren",
          type: "select",
          value: null,
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
          value: [],
          validationRules: {
            maxLength: decimal,
          },
        },
        crackFacadeFrontSizeCheck: {
          label: "Voorgevel scheur",
          type: "checkbox",
          value: true,
          image: "crack-facade-front.svg",
          validationRules: {},
        },
        crackFacadeFrontSizeAmount: {
          label: "Hoeveel scheuren",
          type: "select",
          value: null,
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
          value: [],
          validationRules: {
            maxLength: decimal,
          },
        },
        crackFacadeBackSizeCheck: {
          label: "Achtergevel scheur",
          type: "checkbox",
          value: true,
          image: "crack-facade-back.svg",
          validationRules: {},
        },
        crackFacadeBackSizeAmount: {
          label: "Hoeveel scheuren",
          type: "select",
          value: null,
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
          value: [],
          validationRules: {
            maxLength: decimal,
          },
        },

        crackFacadeLeftSizeCheck: {
          label: "Linkergevel scheur",
          type: "checkbox",
          value: true,
          image: "crack-facade-left.svg",
          validationRules: {},
        },
        crackFacadeLeftSizeAmount: {
          label: "Hoeveel scheuren",
          type: "select",
          value: null,
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
          value: [],
          validationRules: {
            maxLength: decimal,
          },
        },
        crackFacadeRightSizeCheck: {
          label: "Rechtergevel scheur",
          type: "checkbox",
          value: true,
          image: "crack-facade-right.svg",
          validationRules: {},
        },
        crackFacadeRightSizeAmount: {
          label: "Hoeveel scheuren",
          type: "select",
          value: null,
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
          value: [],
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
      //   cpt: this.sample.cpt,
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
  padding: 30px 40px 30px 20px;
  background-color: $catskill-white;
  border-bottom-left-radius: 5px;
  border-bottom-right-radius: 5px;
}

.cracks-wrapper {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}

// .cracks-step {
//   .form-group {
//     margin-bottom: 0;
//   }
// }
</style>
