<template>
  <InquirySampleStep
    title="Omgeving"
    @save="save"
    :is-active="isActive"
    :is-completed="isCompleted"
    :feedback="feedback"
    @select="$emit('select')"
  >
    <Feedback :feedback="internalFeedback" />
    <div class="form-row">
      <div class="col">
        <FormField v-model="fields.cpt.value" v-bind="fields.cpt" />
        <FormField v-model="fields.groundLevel.value" v-bind="fields.groundLevel" />
        <FormField v-model="fields.groundwaterLevelNet.value" v-bind="fields.groundwaterLevelNet" />
      </div>
      <div class="col">
        <FormField v-model="fields.baseMeasurementLevel.value" v-bind="fields.baseMeasurementLevel" />
        <FormField v-model="fields.monitoringWell.value" v-bind="fields.monitoringWell" />
        <FormField v-model="fields.groundwaterLevelTemp.value" v-bind="fields.groundwaterLevelTemp" />
      </div>
    </div>
  </InquirySampleStep>
</template>

<script>
import {
  decimal,
  maxLength
} from "vuelidate/lib/validators";
import { BaseMeasurementLevelOptions } from "config/enums";
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
        cpt: {
          label: "Sondering",
          type: "text",
          value: null,
          validationRules: {
            maxLength: maxLength(128),
          },
        },
        baseMeasurementLevel: {
          label: "Referentieniveau",
          type: "select",
          value: 0,
          options: BaseMeasurementLevelOptions,
          validationRules: {},
        },
        groundLevel: {
          label: "Maaiveldniveau",
          type: "text", // TODO: int
          value: null,
          validationRules: {
            decimal
          },
        },
        monitoringWell: {
          label: "Peilbuis",
          type: "text",
          value: null,
          validationRules: {
            maxLength: maxLength(128),
          },
        },
        groundwaterLevelNet: {
          label: "Grondwaterniveau",
          type: "text", // TODO: int
          value: null,
          validationRules: {
            decimal
          }
        },
        groundwaterLevelTemp: {
          label: "Grondwaterniveau bij ontgravinng",
          type: "text", // TODO: int
          value: null,
          validationRules: {
            decimal
          }
        }
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
      val.cpt = this.fields.cpt.value;
      val.baseMeasurementLevel = this.fields.baseMeasurementLevel.value;
      val.groundLevel = this.fields.groundLevel.value;
      val.monitoringWell = this.fields.monitoringWell.value;
      val.groundwaterLevelNet = this.fields.groundwaterLevelNet.value;
      val.groundwaterLevelTemp = this.fields.groundwaterLevelTemp.value;
      this.$emit("input", val);
      this.$emit("save", { sample: val, next: next});
    },
    async initialize(sample) {
      if (sample) {
        this.setFieldValues({
          cpt: sample.cpt ? sample.cpt : null,
          baseMeasurementLevel: sample.baseMeasurementLevel ? sample.baseMeasurementLevel : 0,
          groundLevel: sample.groundLevel ? sample.groundLevel : null,
          monitoringWell: sample.monitoringWell ? sample.monitoringWell : null,
          groundwaterLevelNet: sample.groundwaterLevelNet ? sample.groundwaterLevelNet : null,
          groundwaterLevelTemp: sample.groundwaterLevelTemp ? sample.groundwaterLevelTemp : null
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
