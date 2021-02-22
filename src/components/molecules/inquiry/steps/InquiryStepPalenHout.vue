<template>
  <InquirySampleStep
    v-if="value && isWood(value.foundationType)"
    title="Palen & Hout"
    @save="save"
    :is-active="isActive"
    :is-completed="isCompleted"
    :feedback="feedback"
    @select="$emit('select')"
  >
    <Feedback :feedback="internalFeedback" />
    <div class="form-row">
      <div class="col">
        <FormField
          v-model="fields.pileHeadLevel.value"
          v-bind="fields.pileHeadLevel"
        />
        <FormField
          v-model="fields.pileDiameterTop.value"
          v-bind="fields.pileDiameterTop"
        />
        <FormField
          v-model="fields.pileDistanceLength.value"
          v-bind="fields.pileDistanceLength"
        />
      </div>
      <div class="col">
        <FormField
          v-model="fields.pileTipLevel.value"
          v-bind="fields.pileTipLevel"
        />
        <FormField
          v-model="fields.pileDiameterBottom.value"
          v-bind="fields.pileDiameterBottom"
        />
        <FormField
          :disabled="!isWoodCharger(value.foundationType)"
          v-model="fields.concreteChargerLength.value"
          v-bind="fields.concreteChargerLength"
        />
      </div>
    </div>
    <hr />
    <div class="form-row">
      <div class="col">
        <FormField v-model="fields.woodType.value" v-bind="fields.woodType" />

        <FormField
          v-model="fields.woodPenetrationDepth.value"
          v-bind="fields.woodPenetrationDepth"
        />
        <FormField
          v-model="fields.woodQuality.value"
          v-bind="fields.woodQuality"
        />
        <FormField
          v-model="fields.pileWoodCapacityVerticalQuality.value"
          v-bind="fields.pileWoodCapacityVerticalQuality"
        />
      </div>
      <div class="col">
        <FormField
          v-model="fields.woodQualityNecessity.value"
          v-bind="fields.woodQualityNecessity"
        />

        <FormField
          v-model="fields.woodEncroachement.value"
          v-bind="fields.woodEncroachement"
        />
        <FormField
          v-model="fields.carryingCapacityQuality.value"
          v-bind="fields.carryingCapacityQuality"
        />
        <FormField
          v-model="fields.woodCapacityHorizontalQuality.value"
          v-bind="fields.woodCapacityHorizontalQuality"
        />
      </div>
    </div>
  </InquirySampleStep>
</template>

<script>
import { decimal, maxValue, minValue } from "vuelidate/lib/validators";
import { woodEncroachement, quality, isWood, isWoodCharger } from "config/enums";
import Feedback from "atom/Feedback";

import InquirySampleStep from "molecule/inquiry/InquirySampleStep";
import FormField from "molecule/form/FormField";

import fields from "mixin/fields";

export default {
  components: {
    InquirySampleStep,
    FormField,
    Feedback
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
      type: Object
    },
    feedback: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    return {
      isDisabled: false,
      internalFeedback: {},
      fields: {
        // Palen
        pileHeadLevel: {
          label: "Paalkop niveau",
          type: "text", // TODO: int
          value: null,
          validationRules: {
            decimal,
            maxValue: maxValue(999),
            minValue: minValue(-999)
          }
        },
        pileTipLevel: {
          label: "Paalpunt niveau",
          type: "text", // TODO: int
          value: null,
          validationRules: {
            decimal,
            maxValue: maxValue(999),
            minValue: minValue(-999)
          }
        },
        pileDiameterTop: {
          label: "Paalkop diameter",
          type: "text", // TODO: int
          value: null,
          validationRules: {
            decimal,
            maxValue: maxValue(999),
            minValue: minValue(-999)
          }
        },
        pileDiameterBottom: {
          label: "Paalpunt diameter",
          type: "text", // TODO: int
          value: null,
          validationRules: {
            decimal,
            maxValue: maxValue(999),
            minValue: minValue(-999)
          }
        },
        pileDistanceLength: {
          label: "Hart-op-hart afstand",
          type: "text", // TODO: int
          value: null,
          validationRules: {
            decimal,
            maxValue: maxValue(999),
            minValue: minValue(-999)
          }
        },
        concreteChargerLength: {
          label: "Oplanger lengte",
          type: "text", // TODO: int
          value: null,
          validationRules: {
            decimal,
            maxValue: maxValue(999),
            minValue: minValue(-999)
          }
        },
        // Hout
        woodType: {
          label: "Houtsoort",
          type: "radio",
          value: null,
          options: [
            {
              value: 0,
              text: "Vuren"
            },
            {
              value: 1,
              text: "Grenen"
            }
          ],
          validationRules: {}
        },
        woodQualityNecessity: {
          label: "Houtonderzoek",
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
        woodPenetrationDepth: {
          label: "Inslagdiepte",
          type: "text", // TODO: int
          value: null,
          validationRules: {
            decimal,
            maxValue: maxValue(999),
            minValue: minValue(-999)
          }
        },
        woodEncroachement: {
          label: "Hout aantasting",
          type: "select", // TODO: int
          value: null,
          options: [
            {
              value: null,
              text: "Selecteer een optie"
            }
          ].concat(woodEncroachement),
          validationRules: {}
        },
        woodQuality: {
          label: "Houtkwaliteit paal",
          type: "select", // TODO: int
          value: null,
          options: [
            {
              value: null,
              text: "Selecteer een optie"
            }
          ].concat(quality),
          validationRules: {}
        },
        carryingCapacityQuality: {
          label: "Kwaliteit draagkracht paal",
          type: "select", // TODO: int
          value: null,
          options: [
            {
              value: null,
              text: "Selecteer een optie"
            }
          ].concat(quality),
          validationRules: {}
        },
        pileWoodCapacityVerticalQuality: {
          label: "Resterende draagkracht paal",
          type: "select", // TODO: int
          value: null,
          options: [
            {
              value: null,
              text: "Selecteer een optie"
            }
          ].concat(quality),
          validationRules: {}
        },
        woodCapacityHorizontalQuality: {
          label: "Horizontale draagkracht paal",
          type: "select", // TODO: int
          value: null,
          options: [
            {
              value: null,
              text: "Selecteer een optie"
            }
          ].concat(quality),
          validationRules: {}
        }
      }
    };
  },
  watch: {
    value: {
      async handler(newValue) {
        await this.initialize(newValue);
      },
      deep: true
    }
  },
  async created() {
    await this.initialize(this.value);
  },
  methods: {
    isWood,
    isWoodCharger,
    save(next) {
      const val = this.value;
      val.pileHeadLevel = this.fields.pileHeadLevel.value;
      val.pileTipLevel = this.fields.pileTipLevel.value;
      val.pileDiameterTop = this.fields.pileDiameterTop.value;
      val.pileDiameterBottom = this.fields.pileDiameterBottom.value;
      val.pileDistanceLength = this.fields.pileDistanceLength.value;
      val.concreteChargerLength = this.value
        ? isWoodCharger(this.value.foundationType)
          ? this.fields.concreteChargerLength.value
          : null
        : null;
      val.woodType = this.fields.woodType.value;
      val.woodQualityNecessity = this.fields.woodQualityNecessity.value;
      val.woodPenetrationDepth = this.fields.woodPenetrationDepth.value;
      val.woodEncroachement = this.fields.woodEncroachement.value;
      val.woodQuality = this.fields.woodQuality.value;
      val.carryingCapacityQuality = this.fields.carryingCapacityQuality.value;
      val.pileWoodCapacityVerticalQuality = this.fields.pileWoodCapacityVerticalQuality.value;
      val.woodCapacityHorizontalQuality = this.fields.woodCapacityHorizontalQuality.value;

      this.$emit("input", val);
      this.$emit("save", { sample: val, next: next });
    },
    async initialize(sample) {
      if (sample) {
        this.setFieldValues({
          pileHeadLevel: sample.pileHeadLevel,
          pileTipLevel: sample.pileTipLevel,
          pileDiameterTop: sample.pileDiameterTop,
          pileDiameterBottom: sample.pileDiameterBottom,
          pileDistanceLength: sample.pileDistanceLength,
          concreteChargerLength: sample.concreteChargerLength,
          woodType: sample.woodType,
          woodQualityNecessity: sample.woodQualityNecessity,
          woodPenetrationDepth: sample.woodPenetrationDepth,
          woodEncroachement: sample.woodEncroachement,
          woodQuality: sample.woodQuality,
          carryingCapacityQuality: sample.carryingCapacityQuality,
          pileWoodCapacityVerticalQuality:
            sample.pileWoodCapacityVerticalQuality,
          woodCapacityHorizontalQuality: sample.woodCapacityHorizontalQuality
        });
      }
    }
  }
};
</script>
