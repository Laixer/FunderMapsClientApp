<template>
  <Form
    ref="form"
    class="py-4 px-5"
    @submit="handleSubmit"
    @error="handleFormError"
  >
    <Feedback :feedback="feedback" />

    <div class="form-row">
      <FormField
        v-model="fields.address.value"
        v-bind="fields.address"
        :serializer="addressSerializer"
        @input="getAddresses"
        @hit="handleHit"
        class="col-md-12"
      />
    </div>

    <div class="form-row">
      <FormField
        v-model="fields.foundationType.value"
        v-bind="fields.foundationType"
        class="col-md-5"
      />
      <FormField
        v-model="fields.substructure.value"
        v-bind="fields.substructure"
        class="col-md-5"
      />
      <FormField
        v-model="fields.builtYear.value"
        v-bind="fields.builtYear"
        class="col-md-2"
      />
    </div>

    <div class="form-row">
      <FormField
        v-model="fields.monitoringWell.value"
        v-bind="fields.monitoringWell"
        class="col-md-6"
      />
      <FormField
        v-model="fields.cpt.value"
        v-bind="fields.cpt"
        class="col-md-6"
      />
    </div>

    <Divider />

    <div class="form-row">
      <FormField
        v-model="fields.overallQuality.value"
        v-bind="fields.overallQuality"
        class="col-md-6"
      />
      <FormField
        v-model="fields.recoveryAdvised.value"
        v-bind="fields.recoveryAdvised"
        class="col-md-6"
      />
    </div>

    <div class="form-row">
      <FormField
        v-model="fields.damageCause.value"
        v-bind="fields.damageCause"
        class="col-md-6"
      />
      <FormField
        v-model="fields.enforcementTerm.value"
        v-bind="fields.enforcementTerm"
        class="col-md-6"
      />
    </div>

    <div class="form-row">
      <FormField
        v-model="fields.woodLevel.value"
        v-bind="fields.woodLevel"
        class="col-md-3"
      />
      <FormField
        v-model="fields.groundwaterLevelTemp.value"
        v-bind="fields.groundwaterLevelTemp"
        class="col-md-3"
      />
      <FormField
        v-model="fields.groundLevel.value"
        v-bind="fields.groundLevel"
        class="col-md-3"
      />
    </div>
  </Form>
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
  foundationQualityOptions,
  enforcementTermOptions,
  substructureOptions,
  foundationDamageCauseOptions,
} from "config/enums";

import Divider from "atom/Divider";
import Form from "molecule/form/Form";
import FormField from "molecule/form/FormField";
import Feedback from "atom/Feedback";

import fields from "mixin/fields";

import { mapGetters, mapActions } from "vuex";
import SampleModel from "../../models/Sample";

export default {
  components: {
    Form,
    FormField,
    Divider,
    Feedback,
  },
  mixins: [fields],
  props: {
    sample: {
      type: SampleModel,
      required: true,
    },
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
            maxLength: maxLength(128),
          },
        },
        // LINE 2
        foundationType: {
          label: "Funderingstype",
          type: "select",
          value: null,
          options: [
            {
              value: null,
              text: "Selecteer een optie",
            },
          ].concat(foundationTypeOptions),
          validationRules: {},
        },
        substructure: {
          label: "Onderbouw",
          type: "select",
          value: null,
          options: [
            {
              value: null,
              text: "Selecteer een optie",
            },
          ].concat(substructureOptions),
          validationRules: {},
        },
        builtYear: {
          label: "Bouwjaar",
          type: "text", // TODO: int
          value: "",
          validationRules: {
            numeric,
            minValue: minValue(1000),
            maxValue: maxValue(2100),
          },
        },
        // LINE 3
        monitoringWell: {
          label: "Peilbuis",
          type: "text",
          value: "",
          validationRules: {
            maxLength: maxLength(32),
          },
        },
        cpt: {
          label: "Sondering",
          type: "text",
          value: "",
          validationRules: {
            maxLength: maxLength(32),
          },
        },
        // DIVIDER
        // LINE 4
        overallQuality: {
          label: "Funderingskwaliteit",
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
        recoveryAdvised: {
          label: "Funderingsherstel advies",
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
        // LINE 5
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
          validationRules: {
            // required
          },
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
        woodLevel: {
          label: "Hoogte langshout",
          type: "text",
          value: "",
          validationRules: {
            decimal,
          },
        },
        groundwaterLevelTemp: {
          label: "Grondwaterstand",
          type: "text",
          value: "",
          validationRules: {
            decimal,
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
      },
    };
  },
  watch: {
    // If any field changes, mark the stored status as false
    fields: {
      handler() {
        this.stored = false;
      },
      deep: true,
    },
  },
  computed: {
    ...mapGetters("report", ["activeReport"]),
  },
  async created() {
    if (this.sample.stored === false) {
      this.feedback = {
        variant: "info",
        message: "Let op: Dit adres is nog niet opgeslagen",
      };
    }

    // Explicitly set the address field.
    if (this.sample.address !== null) {
      let addressFetched = await this.getAddressById({
        id: this.sample.address,
      });
      this.fields.address.value = addressFetched.format();
      this.fields.address.selected = addressFetched;
    }

    this.setFieldValues({
      foundationType: this.optionValue({
        options: foundationTypeOptions,
        name: "foundationType",
      }),
      substructure: this.optionValue({
        options: substructureOptions,
        name: "substructure",
      }),
      builtYear: this.sample.builtYear
        ? new Date(this.sample.builtYear).getFullYear()
        : null,
      monitoringWell: this.sample.monitoringWell,
      cpt: this.sample.cpt,
      overallQuality: this.optionValue({
        options: foundationQualityOptions,
        name: "overallQuality",
      }),
      recoveryAdvised: this.booleanValue({
        name: "recoveryAdvised",
      }),
      damageCause: this.optionValue({
        options: foundationDamageCauseOptions,
        name: "damageCause",
      }),
      enforcementTerm: this.optionValue({
        options: enforcementTermOptions,
        name: "enforcementTerm",
      }),
      woodLevel: this.sample.woodLevel,
      groundwaterLevelTemp: this.sample.groundwaterLevelTemp,
      groundLevel: this.sample.groundLevel,
    });

    // After setting the field values, set the DB storage status
    this.$nextTick(() => {
      this.stored = this.sample.stored !== false;
    });
  },
  methods: {
    ...mapActions("samples", ["updateSample", "createSample", "deleteSample"]),
    ...mapActions("address", ["getAddressById", "getAddressSuggestions"]),
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
    async handleHit(address) {
      const { response } = await fetch(
        `https://api.pdok.nl/bzk/locatieserver/search/v3_1/lookup?fl=nummeraanduiding_id&id=${address.id}`
      ).then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      });

      const _id = `NL.IMBAG.NUMMERAANDUIDING.${response.docs[0].nummeraanduiding_id}`;
      let _address = await this.getAddressById({ id: _id });

      this.fields.address.value = address.weergavenaam;
      this.fields.address.selected = _address;

      this.$emit("addressSelected", { addressId: _address.id });
    },
    formatAddressDisplayName(address) {
      return address.displayName;
    },
    async getAddresses(query) {
      // Only process if we have a substantial amount of characters to go by.
      if (query.length < 4) {
        return;
      }

      // TODO Race condition when we keep on typing.
      let addresses = await this.getAddressSuggestions({ query: query });
      this.fields.address.data = addresses;
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
        message: "Het adres wordt verwijderd...",
      };
      this.deleteSample({
        inquiryId: this.activeReport.id,
        sampleId: this.sample.id,
        creationstamp: this.sample.creationstamp,
      });
    },
    // Called when we submit our sample.
    async handleSubmit() {
      if (this.isDisabled) {
        return;
      }
      this.isDisabled = true;
      this.disableAllFields();
      this.feedback = {
        variant: "info",
        message: "Het adres wordt opgeslagen...",
      };

      let data = this.allFieldValues();
      if (this.sample.id) {
        data.id = this.sample.id;
      } else {
        // Used internally, not by the API
        data.creationstamp = this.sample.creationstamp;
      }

      // Assign address geocoder id from selected field
      data.address = this.fields.address.selected.id;
      data.report = this.activeReport.id;

      console.log(this.fields.address.selected);

      // TODO These fields should be mapped automatically
      data.builtYear = data.builtYear
        ? new Date(data.builtYear, 1, 1, 0, 0, 0, 0)
        : null;
      data.groundLevel = data.groundLevel ? Number(data.groundLevel) : null;
      data.groundwaterLevelTemp = data.groundwaterLevelTemp
        ? Number(data.groundwaterLevelTemp)
        : null;
      data.woodLevel = data.woodLevel ? Number(data.woodLevel) : null;

      if (data.id) {
        await this.updateSample({
          inquiryId: this.activeReport.id,
          sampleId: data.id,
          data: data,
        })
          .then(this.handleSuccess)
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
    handleSuccess() {
      try {
        this.feedback = {
          variant: "success",
          message: "De wijzigingen zijn opgeslagen",
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
    handleError(err) {
      this.feedback = {
        variant: "danger",
        message: "De wijzigingen zijn niet opgeslagen",
      };
      this.enableAllFields();
      this.isDisabled = false;
      this.$emit("stored", { success: false, message: "Unable to save" });
    },
    handleFormError() {
      this.feedback = {
        variant: "danger",
        message: "Controleer a.u.b. de invoer",
      };
      this.$emit("stored", { success: false, message: "Invalid input" });
    },
  },
};
</script>
