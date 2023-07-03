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
      <h5 class="FormStep__title">Omgeving</h5>
    </router-link>

    <div class="FormStepForm" v-show="active">
      <Form ref="form" @submit="handleSubmit">
        <Feedback :feedback="feedback" />
        <div class="form-row">
          <FormField
            v-model="fields.cpt.value"
            v-bind="fields.cpt"
            class="col-md-6"
          />
        </div>

        <div class="form-row">
          <FormField
            v-model="fields.groundLevel.value"
            v-bind="fields.groundLevel"
            class="col-md-6"
          />

          <FormField
            v-model="fields.monitoringWell.value"
            v-bind="fields.monitoringWell"
            class="col-md-6"
          />
        </div>

        <div class="form-row">
          <FormField
            v-model="fields.groundwaterLevelTemp.value"
            v-bind="fields.groundwaterLevelTemp"
            class="col-md-6"
          />

          <FormField
            v-model="fields.groundwaterLevelNet.value"
            v-bind="fields.groundwaterLevelNet"
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
  decimal,
  maxLength,
  minValue,
  maxValue,
} from "vuelidate/lib/validators";

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
          type: "number",
          value: "",
          info: "m t.o.v. NAP",
          validationRules: {
            decimal,
            minValue: minValue(-999.99),
            maxValue: maxValue(999.99),
          },
        },
        monitoringWell: {
          label: "Peilbuisnummer",
          type: "text",
          value: "",
          validationRules: {
            maxLength: maxLength(32),
          },
        },
        groundwaterLevelTemp: {
          label: "Grondwaterniveau",
          type: "number",
          value: "",
          info: "m t.o.v. NAP",
          validationRules: {
            decimal,
            minValue: minValue(-999.99),
            maxValue: maxValue(999.99),
          },
        },
        groundwaterLevelNet: {
          label: "Grondwaterniveau bij ontgraving",
          type: "number",
          value: "",
          info: "m t.o.v. NAP",
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
    // Explicitly set the address field.
    this.setFieldValues({
      cpt: this.sample.cpt,
      groundLevel: this.sample.groundLevel,
      monitoringWell: this.sample.monitoringWell,
      groundwaterLevelTemp: this.sample.groundwaterLevelTemp,
      groundwaterLevelNet: this.sample.groundwaterLevelNet,
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
      this.$router.push({
        name: "edit-report-2",
        params: {
          page: this.$route.params.page,
          step: this.step + 1,
        },
      });
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

      let data = this.allFieldValues();

      data.groundLevel = data.groundLevel ? Number(data.groundLevel) : null;
      data.groundwaterLevelTemp = data.groundwaterLevelTemp
        ? Number(data.groundwaterLevelTemp)
        : null;
      data.groundwaterLevelNet = data.groundwaterLevelNet
        ? Number(data.groundwaterLevelNet)
        : null;

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
