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
      </div>
    </div>
    <div class="form-row">
      <div class="col">
        <FormField
          v-model="fields.groundLevel.value"
          v-bind="fields.groundLevel"
        />
        <FormField
          v-model="fields.groundwaterLevelNet.value"
          v-bind="fields.groundwaterLevelNet"
        />
      </div>
      <div class="col">
        <FormField
          v-model="fields.monitoringWell.value"
          v-bind="fields.monitoringWell"
        />
        <FormField
          v-model="fields.groundwaterLevelTemp.value"
          v-bind="fields.groundwaterLevelTemp"
        />
      </div>
    </div>
  </InquirySampleStep>
</template>

<script>
import {
  decimal,
  maxLength,
  maxValue,
  minValue,
} from "vuelidate/lib/validators";
import Feedback from "atom/Feedback";

import InquirySampleStep from "molecule/inquiry/InquirySampleStep";
import FormField from "molecule/form/FormField";

import fields from "mixin/fields";

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
        groundLevel: {
          label: "Maaiveldniveau",
          type: "text", // TODO: int
          value: null,
          validationRules: {
            decimal,
            maxValue: maxValue(999),
            minValue: minValue(-999),
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
            decimal,
            maxValue: maxValue(999),
            minValue: minValue(-999),
          },
        },
        groundwaterLevelTemp: {
          label: "Grondwaterniveau bij ontgraving",
          type: "text", // TODO: int
          value: null,
          validationRules: {
            decimal,
            maxValue: maxValue(999),
            minValue: minValue(-999),
          },
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
  async created() {
    await this.initialize(this.value);
  },
  methods: {
    save(next) {
      const val = this.value;
      val.cpt = this.fields.cpt.value;
      val.groundLevel = this.fields.groundLevel.value;
      val.monitoringWell = this.fields.monitoringWell.value;
      val.groundwaterLevelNet = this.fields.groundwaterLevelNet.value;
      val.groundwaterLevelTemp = this.fields.groundwaterLevelTemp.value;
      this.$emit("input", val);
      this.$emit("save", { sample: val, next: next });
    },
    async initialize(sample) {
      if (sample) {
        this.setFieldValues({
          cpt: sample.cpt,
          groundLevel: sample.groundLevel,
          monitoringWell: sample.monitoringWell,
          groundwaterLevelNet: sample.groundwaterLevelNet,
          groundwaterLevelTemp: sample.groundwaterLevelTemp,
        });
      }
    },
  },
};
</script>
