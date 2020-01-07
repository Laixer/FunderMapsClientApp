<template>
  <Form ref="form" class="py-4 px-5" @submit="handleSubmit" @error="handleFormError">
    <Feedback :feedback="feedback" />

    <div class="form-row mb-3">
      <FormField
        v-model="fields.address.value"
        v-bind="fields.address"
        :serializer="addressSerializer"
        @input="getAddresses"
        @hit="handleHit"
        class="col-md-12"
      />
    </div>

    <div class="form-row mb-3">
      <FormField
        v-model="fields.foundationType.value"
        v-bind="fields.foundationType"
        class="col-md-5"
      />
      <FormField v-model="fields.substructure.value" v-bind="fields.substructure" class="col-md-5" />
      <FormField v-model="fields.builtYear.value" v-bind="fields.builtYear" class="col-md-2" />
    </div>

    <div class="form-row">
      <FormField
        v-model="fields.monitoringWell.value"
        v-bind="fields.monitoringWell"
        class="col-md-6"
      />
      <FormField v-model="fields.cpt.value" v-bind="fields.cpt" class="col-md-6" />
    </div>

    <Divider />

    <div class="form-row mb-3">
      <FormField
        v-model="fields.foundationQuality.value"
        v-bind="fields.foundationQuality"
        class="col-md-6"
      />
      <FormField
        v-model="fields.foundationRecoveryAdviced.value"
        v-bind="fields.foundationRecoveryAdviced"
        class="col-md-6"
      />
    </div>

    <div class="form-row mb-3">
      <FormField
        v-model="fields.foundationDamageCause.value"
        v-bind="fields.foundationDamageCause"
        class="col-md-6"
      />
      <FormField
        v-model="fields.enforcement_term.value"
        v-bind="fields.enforcement_term"
        class="col-md-6"
      />
    </div>

    <div class="form-row">
      <FormField
        v-model="fields.baseMeasurementLevel.value"
        v-bind="fields.baseMeasurementLevel"
        class="col-md-3"
      />
      <FormField v-model="fields.woodLevel.value" v-bind="fields.woodLevel" class="col-md-3" />
      <FormField
        v-model="fields.groundwaterLevel.value"
        v-bind="fields.groundwaterLevel"
        class="col-md-3"
      />
      <FormField v-model="fields.groundLevel.value" v-bind="fields.groundLevel" class="col-md-3" />
    </div>
  </Form>
</template>

<script>
import axios from "axios";
import {
  required,
  numeric,
  decimal,
  maxLength,
  minValue,
  maxValue
} from "vuelidate/lib/validators";
import {
  foundationTypeOptions,
  foundationQualityOptions,
  enforcementTermOptions,
  substructureOptions,
  foundationDamageCauseOptions,
  BaseMeasurementLevelOptions
} from "config/enums";

import Divider from "atom/Divider";
import Form from "molecule/form/Form";
import FormField from "molecule/form/FormField";
import Feedback from "atom/Feedback";

import fields from "mixin/fields";

import { mapGetters, mapActions } from "vuex";

export default {
  components: {
    Form,
    FormField,
    Divider,
    Feedback
  },
  mixins: [fields],
  props: {
    sample: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      isDisabled: false,
      stored: false,
      feedback: {},
      fields: {
        // LINE 1
        address: {
          label: "Adres",
          type: "typeahead",
          selected: null,
          value: "",
          data: [],
          validationRules: {
            required,
            maxLength: maxLength(128)
          }
        },
        // LINE 2
        foundationType: {
          label: "Funderingstype",
          type: "select",
          value: null,
          options: [
            {
              value: null,
              text: "Selecteer een optie"
            }
          ].concat(foundationTypeOptions),
          validationRules: {}
        },
        substructure: {
          label: "Onderbouw",
          type: "select",
          value: null,
          options: [
            {
              value: null,
              text: "Selecteer een optie"
            }
          ].concat(substructureOptions),
          validationRules: {}
        },
        builtYear: {
          label: "Bouwjaar",
          type: "text", // TODO: int
          value: "",
          validationRules: {
            numeric,
            minValue: minValue(1000),
            maxValue: maxValue(2100)
          }
        },
        // LINE 3
        monitoringWell: {
          label: "Peilbuis",
          type: "text",
          value: "",
          validationRules: {
            maxLength: maxLength(32)
          }
        },
        cpt: {
          label: "Sondering",
          type: "text",
          value: "",
          validationRules: {
            maxLength: maxLength(32)
          }
        },
        // DIVIDER
        // LINE 4
        foundationQuality: {
          label: "Funderingskwaliteit",
          type: "select",
          value: null,
          options: [
            {
              value: null,
              text: "Selecteer een optie"
            }
          ].concat(foundationQualityOptions),
          validationRules: {}
        },
        foundationRecoveryAdviced: {
          label: "Funderingsherstel advies",
          type: "radio",
          value: null,
          options: [
            {
              value: true,
              text: "Ja"
            },
            {
              value: false,
              text: "Nee"
            }
          ],
          validationRules: {}
        },
        // LINE 5
        foundationDamageCause: {
          label: "Oorzaak funderingsschade",
          type: "select",
          value: null,
          options: [
            {
              value: null,
              text: "Selecteer een optie"
            }
          ].concat(foundationDamageCauseOptions),
          validationRules: {
            required
          }
        },
        enforcement_term: {
          label: "Handhavingstermijn",
          type: "select",
          value: null,
          options: [
            {
              value: null,
              text: "Selecteer een optie"
            }
          ].concat(enforcementTermOptions),
          validationRules: {}
        },
        // LINE 6
        baseMeasurementLevel: {
          label: "Referentiestelsel",
          type: "select",
          value: "NAP",
          options: [
            {
              value: null,
              text: "Selecteer een optie"
            }
          ].concat(BaseMeasurementLevelOptions),
          validationRules: {
            required
          }
        },
        woodLevel: {
          label: "Hoogte langshout",
          type: "text",
          value: "",
          validationRules: {
            decimal
          }
        },
        groundwaterLevel: {
          label: "Grondwaterstand",
          type: "text",
          value: "",
          validationRules: {
            decimal
          }
        },
        groundLevel: {
          label: "Maaiveldhoogte",
          type: "text",
          value: "",
          validationRules: {
            decimal
          }
        }
      }
    };
  },
  watch: {
    // If any field changes, mark the stored status as false
    fields: {
      handler() {
        this.stored = false;
      },
      deep: true
    }
  },
  computed: {
    ...mapGetters("report", ["activeReport"])
  },
  created() {
    if (this.sample.stored === false) {
      this.feedback = {
        variant: "info",
        message: "Let op: Dit adres is nog niet opgeslagen"
      };
    }
    // Required fields by API
    if (!this.sample.baseMeasurementLevel) {
      this.sample.baseMeasurementLevel = 0; // NAP
    }
    if (this.sample.foundationDamageCause === null) {
      this.sample.foundationDamageCause = 7; // Unknown
    }

    this.setFieldValues({
      address: this.sample.address.streetName
        ? this.sample.address.streetName
        : "",
      foundationType: this.optionValue({
        options: foundationTypeOptions,
        name: "foundationType"
      }),
      substructure: this.optionValue({
        options: substructureOptions,
        name: "substructure"
      }),
      builtYear: this.sample.builtYear,
      monitoringWell: this.sample.monitoringWell,
      cpt: this.sample.cpt,
      foundationQuality: this.optionValue({
        options: foundationQualityOptions,
        name: "foundationQuality"
      }),
      foundationRecoveryAdviced: this.booleanValue({
        name: "foundationRecoveryAdviced"
      }),
      foundationDamageCause: this.optionValue({
        options: foundationDamageCauseOptions,
        name: "foundationDamageCause"
      }),
      enforcement_term: this.optionValue({
        options: enforcementTermOptions,
        name: "enforcement_term"
      }),
      baseMeasurementLevel: this.optionValue({
        options: BaseMeasurementLevelOptions,
        name: "baseMeasurementLevel"
      }),
      woodLevel: this.sample.woodLevel,
      groundwaterLevel: this.sample.groundwaterLevel,
      groundLevel: this.sample.groundLevel
    });

    // After setting the field values, set the DB storage status
    this.$nextTick(() => {
      this.stored = this.sample.stored !== false;
    });
  },
  methods: {
    ...mapActions("samples", ["updateSample", "createSample", "deleteSample"]),
    optionValue({ options, name }) {
      let key = this.sample[name];
      return options[key] ? options[key].value : null;
    },
    booleanValue({ name }) {
      return this.sample[name] === true || this.sample[name] === false
        ? this.sample[name]
        : null;
    },
    addressSerializer(address) {
      return address.weergavenaam;
    },
    async handleHit(a) {
      // TODO: This should be handled via a store
      let response = await axios(
        `https://geodata.nationaalgeoregister.nl/locatieserver/v3/lookup?id=${a.id}`
      );
      if (response.status === 200 && response.data) {
        if (response.data.response.numFound == 1) {
          let address = response.data.response.docs[0];
          this.fields.address.value = address.weergavenaam;
          this.fields.address.selected = address;
        }
      }
    },
    async getAddresses(query) {
      // TODO: This should be handled via a store
      let response = await axios(
        `https://geodata.nationaalgeoregister.nl/locatieserver/v3/suggest?q=${query}&fq=type:adres`
      );
      if (response.status === 200 && response.data) {
        if (response.data.response.numFound > 0) {
          this.fields.address.data = response.data.response.docs;
        }
      }
    },
    // Called by parent
    async save() {
      if (!this.stored) {
        return await this.$refs.form.submit();
      } else {
        this.$emit("stored", { success: true });
      }
    },
    // Called by parent
    isStored() {
      return this.stored;
    },
    // Called by parent
    delete() {
      if (this.isDisabled) {
        return;
      }
      this.isDisabled = true;
      this.disableAllFields();
      this.feedback = {
        variant: "info",
        message: "Het adres wordt verwijderd..."
      };
      this.deleteSample({
        id: this.sample.id,
        creationstamp: this.sample.creationstamp
      });
    },
    async handleSubmit() {
      if (this.isDisabled) {
        return;
      }
      this.isDisabled = true;
      this.disableAllFields();
      this.feedback = {
        variant: "info",
        message: "Het adres wordt opgeslagen..."
      };

      let data = this.allFieldValues();
      if (this.sample.id) {
        data.id = this.sample.id;
      } else {
        // Used internally, not by the API
        data.creationstamp = this.sample.creationstamp;
      }

      // required by API
      if (data.baseMeasurementLevel === null) {
        data.baseMeasurementLevel = 0; // NAP
      }
      if (data.foundationDamageCause === null) {
        data.foundationDamageCause = 7; // Unknown
      }

      data.address = {
        streetName: this.fields.address.selected.weergavenaam, // NOTE: For now, just so we get back the entire name
        building_number: this.fields.address.selected.huisnummer,
        bag: this.fields.address.selected.nummeraanduiding_id,
        additional: this.fields.address.selected
      };
      data.report = this.activeReport.id;

      if (data.id) {
        await this.updateSample({
          id: data.id,
          data
        })
          .then(this.handleSuccess)
          .catch(this.handleError);
      } else {
        await this.createSample({
          data
        })
          .then(this.handleSuccess)
          .catch(this.handleError);
      }
    },
    handleSuccess() {
      try {
        this.feedback = {
          variant: "success",
          message: "De wijzigingen zijn opgeslagen"
        };
        this.enableAllFields();
        this.isDisabled = false;
        this.$refs.form.resetValidation();
        this.stored = true;

        this.$emit("stored", { success: true });
      } catch (err) {
        this.$emit("stored", { success: false, message: err });
      }
    },
    handleError() {
      this.feedback = {
        variant: "danger",
        message: "De wijzigingen zijn niet opgeslagen"
      };
      this.enableAllFields();
      this.isDisabled = false;
      this.$emit("stored", { success: false, message: "Unable to save" });
    },
    handleFormError() {
      this.feedback = {
        variant: "danger",
        message: "Controleer a.u.b. de invoer"
      };
      this.$emit("stored", { success: false, message: "Invalid input" });
    }
  }
};
</script>
