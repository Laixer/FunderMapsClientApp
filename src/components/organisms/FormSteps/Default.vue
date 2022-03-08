<template>
  <div
    class="FormStep"
    :class="{
      'FormStep--active': active == 1,
    }"
  >
    <router-link :to="{ name: 'edit-report-2', params: { page: 2, step: step } }" class="FormStepDropdown">
      <h5 class="FormStep__title">Algemeen</h5>

      <span class="FormStepDropdown__indicator">
        <img :src="icon('Angle.svg')" />
      </span>
    </router-link>

    <div class="FormStepForm" v-if="active">
      <Form ref="form" @submit="handleSubmit" @error="handleFormError">
        <Feedback :feedback="feedback" />
        <div class="form-row mb-3">
          <FormField v-model="fields.address.value" v-bind="fields.address" :serializer="addressSerializer" class="col-9" @input="getAddresses" @hit="handleHit" />

          <FormField v-model="fields.builtYear.value" v-bind="fields.builtYear" class="col-3" />
        </div>

        <div class="form-row">
          <FormField v-model="fields.substructure.value" v-bind="fields.substructure" class="col-md-6" />

          <FormField v-model="fields.recoveryAdvised.value" v-bind="fields.recoveryAdvised" class="col-md-6" />
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

  async created() {
    // Explicitly set the address field.
    if (this.sample.address !== null) {
      let addressFetched = await this.getAddressById({
        id: this.sample.address,
      });
      this.fields.address.value = addressFetched.format();
      this.fields.address.selected = addressFetched;
    }

    var substructure = this.optionValue({
      options: substructureOptions,
      name: "substructure",
    });

    var builtYear = this.sample.builtYear ? new Date(this.sample.builtYear).getFullYear() : null;

    var recoveryAdvised = this.booleanValue({
      name: "recoveryAdvised",
    });

    this.setFieldValues({
      substructure: substructure,
      builtYear: builtYear,
      recoveryAdvised: recoveryAdvised,
    });

    this.$nextTick(() => {
      this.changed = false;
    });
  },

  data() {
    return {
      icon,
      changed: false,
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
      },
    };
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
    ...mapActions("address", ["getAddressById", "getAddressSuggestions"]),
    ...mapActions("samples", ["updateSample", "createSample", "deleteSample"]),
    addressSerializer(address) {
      return address.weergavenaam;
    },
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

    async getAddresses(query) {
      // Only process if we have a substantial amount of characters to go by.
      if (query.length < 4) {
        return;
      }

      // TODO Race condition when we keep on typing.
      let addresses = await this.getAddressSuggestions({ query: query });
      this.fields.address.data = addresses;
    },

    async handleHit(address) {
      const { response } = await fetch(`https://geodata.nationaalgeoregister.nl/locatieserver/v3/lookup?fl=nummeraanduiding_id&id=${address.id}`).then(res => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      });

      const _id = `NL.IMBAG.NUMMERAANDUIDING.${response.docs[0].nummeraanduiding_id}`;

      let _address = await this.getAddressById({ id: _id });

      this.fields.address.value = address.weergavenaam;
      this.fields.address.selected = _address;

      this.$emit("addressSelected", { addressId: _address.id });
    },

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

      // TODO These fields should be mapped automatically
      data.builtYear = data.builtYear ? new Date(data.builtYear, 1, 1, 0, 0, 0, 0) : null;

      console.log("save data:");
      console.log(data);

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
