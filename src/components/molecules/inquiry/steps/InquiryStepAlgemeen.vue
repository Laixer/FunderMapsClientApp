<template>
  <InquirySampleStep
    title="Algemeen"
    @save="save"
    :is-active="isActive"
    :is-completed="isCompleted"
    :feedback="feedback"
    @select="$emit('select')"
  >
    <Feedback :feedback="internalFeedback" />
    <div class="form-row">
      <div class="col-9">
        <FormField
          v-model="fields.address.value"
          v-bind="fields.address"
          :serializer="addressSerializer"
          @input="getAddresses"
          @hit="handleHit"
          class="form-group--long"
        />
      </div>
      <div class="col-3">
        <FormField v-model="fields.builtYear.value" v-bind="fields.builtYear" />
      </div>
    </div>

    <div class="form-row">
      <div class="col">
        <FormField
          v-model="fields.substructure.value"
          v-bind="fields.substructure"
        />
      </div>
      <div class="col">
        <FormField
          v-model="fields.recoveryAdvised.value"
          v-bind="fields.recoveryAdvised"
        />
      </div>
    </div>
  </InquirySampleStep>
</template>

<script>
import {
  required,
  numeric,
  maxLength,
  minValue,
  maxValue,
} from "vuelidate/lib/validators";
import { substructureOptions } from "config/enums";
import Feedback from "atom/Feedback";

import InquirySampleStep from "molecule/inquiry/InquirySampleStep";
import FormField from "molecule/form/FormField";

import fields from "mixin/fields";

import { mapGetters, mapActions } from "vuex";

export default {
  components: {
    InquirySampleStep,
    FormField,
    Feedback,
  },
  mixins: [fields],
  props: {
    isActive: {
      type: Boolean,
      default: false,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    value: {
      type: Object,
    },
    feedback: {
      type: Object,
      default: () => {},
    },
  },
  data() {
    return {
      isDisabled: false,
      internalFeedback: {},
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
          value: null,
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
    value: {
      async handler(newValue) {
        await this.initialize(newValue);
      },
      deep: true,
    },
  },
  computed: {
    ...mapGetters("report", ["activeReport"]),
  },
  async created() {
    await this.initialize(this.value);
  },
  methods: {
    ...mapActions("samples", ["updateSample", "createSample", "deleteSample"]),
    ...mapActions("address", ["getAddressById", "getAddressSuggestions"]),
    optionValue({ options, name }) {
      let key = this.value[name];
      return options[key] ? options[key].value : null;
    },
    save(next) {
      const val = this.value;
      val.address = this.fields.address.selected
        ? this.fields.address.selected.id
        : null;
      val.builtYear = new Date(this.fields.builtYear.value, 1, 1, 0, 0, 0, 0);
      val.substructure = this.fields.substructure.value;
      val.recoveryAdvised = this.fields.recoveryAdvised.value;
      this.$emit("input", val);
      this.$emit("save", { sample: val, next: next});
    },
    async initialize(sample) {
      if (sample) {
        this.internalFeedback = sample.stored
          ? {}
          : this.feedback ? {} : {
              variant: "info",
              message: "Let op: Dit adres is nog niet opgeslagen",
            };

        if (sample.address !== null) {
          let addressFetched = await this.getAddressById({
            id: sample.address,
          });
          this.fields.address.value = addressFetched.format();
          this.fields.address.selected = addressFetched;
        } else {
          this.fields.address.value = null;
          this.fields.address.selected = null;
        }

        this.setFieldValues({
          substructure: this.optionValue({
            options: substructureOptions,
            name: "substructure",
          }),
          builtYear: sample.builtYear
            ? new Date(sample.builtYear).getFullYear()
            : null,
          recoveryAdvised: this.booleanValue({
            name: "recoveryAdvised",
          }),
        });
      }
    },
    booleanValue({ name }) {
      return this.value[name] === true || this.value[name] === false
        ? this.value[name]
        : null;
    },
    addressSerializer(address) {
      return address.weergavenaam;
    },
    async handleHit(suggestion) {
      const { response } = await fetch(
        `https://geodata.nationaalgeoregister.nl/locatieserver/v3/lookup?fl=nummeraanduiding_id&id=${suggestion.id}`
      ).then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      });

      const _id = `NL.IMBAG.NUMMERAANDUIDING.${response.docs[0].nummeraanduiding_id}`;
      let _address = await this.getAddressById({ id: _id });

      this.fields.address.value = _address.format();
      this.fields.address.selected = _address;

      this.$emit("addressSelected", { addressId: _address.id });
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
  },
};
</script>
