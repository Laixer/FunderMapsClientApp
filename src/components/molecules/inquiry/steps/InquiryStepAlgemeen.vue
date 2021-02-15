<template>
    <InquirySampleStep title="Algemeen" :is-active="isActive" :is-completed="isCompleted"  >
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
            <FormField v-model="fields.builtYear.value" v-bind="fields.builtYear"/>
        </div>
      </div>

      <div class="form-row">
        <div class="col">
          <FormField v-model="fields.substructure.value" v-bind="fields.substructure" />
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
import {
  substructureOptions,
} from "config/enums";

import InquirySampleStep from "molecule/inquiry/InquirySampleStep";
import Divider from "atom/Divider";
import FormField from "molecule/form/FormField";
import Feedback from "atom/Feedback";

import fields from "mixin/fields";

import { mapGetters, mapActions } from "vuex";

/**
 * Import API for address from geocoder.
 */
import addressAPI from "api/address";

export default {
  name: "InquirySampleDetailsEditor",
  components: {
    InquirySampleStep,
    FormField,
    // Divider,
    // Feedback
  },
  mixins: [fields],
  props: {
    isActive: {
      type: Boolean,
      default: false
    },
    isCompleted: {
      type: Boolean,
      default: false
    },
    value: {
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
      deep: true,
    },
  },
  computed: {
    ...mapGetters("report", ["activeReport"]),
  },
  async created() {
    if (this.value.stored === false) {
      this.feedback = {
        variant: "info",
        message: "Let op: Dit adres is nog niet opgeslagen",
      };
    }

     // Explicitly set the address field.
    if (this.value.address !== null) {
      let addressFetched = await this.getAddressById({ id: this.value.address });
      this.fields.address.value = addressFetched.format();
      this.fields.address.data = [ addressFetched ];
      this.fields.address.selected = addressFetched;
    }

    this.setFieldValues({
      substructure: this.optionValue({
        options: substructureOptions,
        name: "substructure"
      }),
      builtYear: this.value.builtYear
        ? new Date(this.value.builtYear).getFullYear()
        : null,
      recoveryAdvised: this.booleanValue({
        name: "recoveryAdvised"
      })
      });

    // After setting the field values, set the DB storage status
    this.$nextTick(() => {
      this.stored = this.value.stored !== false;
    });
  },
  methods: {
    ...mapActions("samples", ["updateSample", "createSample", "deleteSample"]),
    ...mapActions("address", ["getAddressById", "getAddressSuggestions"]),
    optionValue({ options, name }) {
      let key = this.value[name];
      return options[key] ? options[key].value : null;
    },
    booleanValue({ name }) {
      return this.value[name] === true || this.value[name] === false
        ? this.value[name]
        : null;
    },
    addressSerializer(address) {
      return address.weergavenaam;
    },
    async handleHit(address) {
      const { response } = await fetch(
        `https://geodata.nationaalgeoregister.nl/locatieserver/v3/lookup?fl=nummeraanduiding_id&id=${address.id}`
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
    }
  }
}
</script>
