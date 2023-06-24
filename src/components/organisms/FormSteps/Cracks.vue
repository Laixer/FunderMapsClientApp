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
                  v-model="fields.crackIndoorRestored.value"
                  v-bind="fields.crackIndoorRestored"
                  class="col-7"
                />
              </div>
              <div class="form-row">
                <FormField
                  v-model="fields.crackIndoorType.value"
                  v-bind="fields.crackIndoorType"
                  class="col form-col"
                />
                <FormField
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
                  v-model="fields.crackFacadeFrontRestored.value"
                  v-bind="fields.crackFacadeFrontRestored"
                  class="col-7"
                />
              </div>
              <div class="form-row">
                <FormField
                  v-model="fields.crackFacadeFrontType.value"
                  v-bind="fields.crackFacadeFrontType"
                  class="col form-col"
                />
                <FormField
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
                  v-model="fields.crackFacadeBackRestored.value"
                  v-bind="fields.crackFacadeBackRestored"
                  class="col-7"
                />
              </div>
              <div class="form-row">
                <FormField
                  v-model="fields.crackFacadeBackType.value"
                  v-bind="fields.crackFacadeBackType"
                  class="col form-col"
                />
                <FormField
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
                  v-model="fields.crackFacadeLeftRestored.value"
                  v-bind="fields.crackFacadeLeftRestored"
                  class="col-7"
                />
              </div>
              <div class="form-row">
                <FormField
                  v-model="fields.crackFacadeLeftType.value"
                  v-bind="fields.crackFacadeLeftType"
                  class="col form-col"
                />
                <FormField
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
                  v-model="fields.crackFacadeRightRestored.value"
                  v-bind="fields.crackFacadeRightRestored"
                  class="col-7"
                />
              </div>
              <div class="form-row">
                <FormField
                  v-model="fields.crackFacadeRightType.value"
                  v-bind="fields.crackFacadeRightType"
                  class="col form-col"
                />
                <FormField
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
import { crackTypeOptions } from "config/enums";
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
        crackIndoorSizeCheck: {
          label: "Inpandige scheur",
          type: "checkbox",
          value: false,
          disabled: true,
          image: "crack-indoor.svg",
        },
        crackIndoorRestored: {
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
        crackIndoorType: {
          label: "Type",
          type: "select",
          value: null,
          options: [
            {
              value: null,
              text: "Selecteer een optie",
            },
          ].concat(crackTypeOptions),
          validationRules: {},
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
          disabled: true,
          image: "crack-facade-front.svg",
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
        crackFacadeFrontType: {
          label: "Type",
          type: "select",
          value: null,
          options: [
            {
              value: null,
              text: "Selecteer een optie",
            },
            ].concat(crackTypeOptions),
          validationRules: {},
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
          disabled: true,
          image: "crack-facade-back.svg",
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
        crackFacadeBackType: {
          label: "Type",
          type: "select",
          value: null,
          options: [
            {
              value: null,
              text: "Selecteer een optie",
            },
            ].concat(crackTypeOptions),
          validationRules: {},
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
          disabled: true,
          image: "crack-facade-left.svg",
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
        crackFacadeLeftType: {
          label: "Type",
          type: "select",
          value: null,
          options: [
            {
              value: null,
              text: "Selecteer een optie",
            },
            ].concat(crackTypeOptions),
          validationRules: {},
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
          disabled: true,
          image: "crack-facade-right.svg",
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
        },
        crackFacadeRightType: {
          label: "Type",
          type: "select",
          value: null,
          options: [
            {
              value: null,
              text: "Selecteer een optie",
            },
            ].concat(crackTypeOptions),
          validationRules: {},
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
      crackIndoorSize: this.sample.crackIndoorSize,
      crackFacadeFrontSize: this.sample.crackFacadeFrontSize,
      crackFacadeBackSize: this.sample.crackFacadeBackSize,
      crackFacadeLeftSize: this.sample.crackFacadeLeftSize,
      crackFacadeRightSize: this.sample.crackFacadeRightSize,
      crackIndoorType: this.sample.crackIndoorType,
      crackFacadeFrontType: this.sample.crackFacadeFrontType,
      crackFacadeBackType: this.sample.crackFacadeBackType,
      crackFacadeLeftType: this.sample.crackFacadeLeftType,
      crackFacadeRightType: this.sample.crackFacadeRightType,
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
