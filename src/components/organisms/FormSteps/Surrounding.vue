<template>
  <div
    class="FormStep"
    :class="{
      'FormStep--active': active == 1,
    }"
  >
    <router-link :to="{ name: 'edit-report-2', params: { page: 2, step: step } }" class="FormStepDropdown">
      <h5 class="FormStep__title">Omgeving</h5>

      <span class="FormStepDropdown__indicator">
        <img :src="icon('Angle.svg')" />
      </span>
    </router-link>

    <div class="FormStepForm" v-if="active">
      <Form ref="form" @submit="handleSubmit">
        <Feedback :feedback="feedback" />
        <div class="form-row mb-3">
          <FormField v-model="fields.cpt.value" v-bind="fields.cpt" class="col-md-6" />
        </div>

        <div class="form-row mb-3">
          <FormField v-model="fields.groundLevel.value" v-bind="fields.groundLevel" class="col-md-6" />

          <FormField v-model="fields.monitoringWell.value" v-bind="fields.monitoringWell" class="col-md-6" />
        </div>

        <div class="form-row mb-3">
          <FormField v-model="fields.groundwaterLevelTemp.value" v-bind="fields.groundwaterLevelTemp" class="col-md-6" />

          <FormField v-model="fields.groundwaterLevelNet.value" v-bind="fields.groundwaterLevelNet" class="col-md-6" />
        </div>
        <span @click="save()" class="btn btn-continue">Opslaan &amp; verder</span>
      </Form>
    </div>
  </div>
</template>

<script>
import { required, numeric, decimal, maxLength, minValue, maxValue } from "vuelidate/lib/validators";

import { substructureOptions } from "config/enums";
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
        // address: {
        //   label: "Adres",
        //   type: "typeahead",
        //   selected: null,
        //   value: "",
        //   data: [],
        //   validationRules: {
        //     required,
        //     maxLength: maxLength(128),
        //   },
        // },
        cpt: {
          label: "Sondering",
          type: "text",
          value: "",
          validationRules: {
            maxLength: maxLength(32),
          },
        },
        groundLevel: {
          label: "Maaiveldhoogte",
          type: "text",
          value: "",
          validationRules: {
            decimal,
          },
        },
        monitoringWell: {
          label: "Peilbuis",
          type: "text",
          value: "",
          validationRules: {
            maxLength: maxLength(32),
          },
        },
        groundwaterLevelTemp: {
          label: "Grondwaterniveau",
          type: "text",
          value: "",
          validationRules: {
            maxLength: maxLength(32),
          },
        },

        groundwaterLevelNet: {
          label: "Grondwaterniveau bij ontgraving",
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
    // Explicitly set the address field.
    this.setFieldValues({
      cpt: this.sample.cpt,
      groundLevel: this.sample.groundLevel,
      monitoringWell: this.sample.monitoringWell,
      groundwaterLevelTemp: this.sample.groundwaterLevelTemp,
      groundwaterLevelNet: this.sample.groundwaterLevelNet,
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
      return this.sample[name] === true || this.sample[name] === false ? this.sample[name] : null;
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

      data.groundLevel = data.groundLevel ? Number(data.groundLevel) : null;
      data.groundwaterLevelTemp = data.groundwaterLevelTemp ? Number(data.groundwaterLevelTemp) : null;
      data.groundwaterLevelNet = data.groundwaterLevelNet ? Number(data.groundwaterLevelNet) : null;

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
