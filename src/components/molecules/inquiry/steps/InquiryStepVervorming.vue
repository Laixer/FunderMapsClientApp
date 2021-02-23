<template>
  <InquirySampleStep
    title="Vervorming"
    @save="save"
    :is-active="isActive"
    :is-completed="isCompleted"
    :feedback="feedback"
    :lastStep="true"
    @select="$emit('select')"
  >
    <Feedback :feedback="internalFeedback" />
    <div class="form-row">
      <div class="col">
        <FormField
          v-model="fields.deformedFacade.value"
          v-bind="fields.deformedFacade"
        />
        <FormField
          :disabled="!fields.thresholdUpdownSkewed.value"
          v-model="fields.skewedParallel.value"
          v-bind="fields.skewedParallel"
          append="cm"
        />
        <FormField
          v-model="fields.thresholdFrontLevel.value"
          v-bind="fields.thresholdFrontLevel"
          append="cm"
        />
        <FormField
          v-model="fields.skewedWindowFrame.value"
          v-bind="fields.skewedWindowFrame"
        />
      </div>
      <div class="col">
        <FormField
          v-model="fields.thresholdUpdownSkewed.value"
          v-bind="fields.thresholdUpdownSkewed"
        />
        <FormField
          :disabled="!fields.thresholdUpdownSkewed.value"
          v-model="fields.skewedPerpendicular.value"
          v-bind="fields.skewedPerpendicular"
          append="cm"
        />
        <FormField
          v-model="fields.thresholdBackLevel.value"
          v-bind="fields.thresholdBackLevel"
          append="cm"
        />
        <FormField
          v-model="fields.settlementSpeed.value"
          v-bind="fields.settlementSpeed"
          append="mm/jaar"
        />
      </div>
    </div>
  </InquirySampleStep>
</template>

<script>
import { decimal, maxValue, minValue } from "vuelidate/lib/validators";
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
        deformedFacade: {
          label: "Gevel vervormd",
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
        thresholdUpdownSkewed: {
          label: "Scheefstand",
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
        skewedParallel: {
          label: "Scheefstand voor naar achter",
          type: "text", // TODO: int
          value: null,
          validationRules: {
            decimal,
            maxValue: maxValue(999),
            minValue: minValue(-999),
          },
        },
        skewedPerpendicular: {
          label: "Scheefstand voor naar achter",
          type: "text", // TODO: int
          value: null,
          validationRules: {
            decimal,
            maxValue: maxValue(999),
            minValue: minValue(-999),
          },
        },
        thresholdFrontLevel: {
          label: "Drempel voorgevel niveau",
          type: "text", // TODO: int
          value: null,
          validationRules: {
            decimal,
            maxValue: maxValue(999),
            minValue: minValue(-999),
          },
        },
        thresholdBackLevel: {
          label: "Drempel achtergevel niveau",
          type: "text", // TODO: int
          value: null,
          validationRules: {
            decimal,
            maxValue: maxValue(999),
            minValue: minValue(-999),
          },
        },
        skewedWindowFrame: {
          label: "Scheve deur- en/of raamkozijnen",
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
        settlementSpeed: {
          label: "Pandzakkingssnelheid",
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
      val.deformedFacade = this.fields.deformedFacade.value;
      val.thresholdUpdownSkewed = this.fields.thresholdUpdownSkewed.value;
      val.skewedParallel = this.fields.skewedParallel.value;
      val.skewedPerpendicular = this.fields.skewedPerpendicular.value;
      val.thresholdFrontLevel = this.fields.thresholdUpdownSkewed.value
        ? this.fields.thresholdFrontLevel.value
        : null;
      val.thresholdBackLevel = this.fields.thresholdUpdownSkewed.value
        ? this.fields.thresholdBackLevel.value
        : null;
      val.skewedWindowFrame = this.fields.skewedWindowFrame.value;
      val.settlementSpeed = this.fields.settlementSpeed.value;

      this.$emit("input", val);
      this.$emit("save", { sample: val, next: next });
    },
    async initialize(sample) {
      if (sample) {
        this.setFieldValues({
          deformedFacade: sample.deformedFacade,
          thresholdUpdownSkewed: sample.thresholdUpdownSkewed,
          skewedParallel: sample.skewedParallel,
          skewedPerpendicular: sample.skewedPerpendicular,
          thresholdFrontLevel: sample.thresholdFrontLevel,
          thresholdBackLevel: sample.thresholdBackLevel,
          skewedWindowFrame: sample.skewedWindowFrame,
          settlementSpeed: sample.settlementSpeed,
        });
      }
    },
  },
};
</script>
