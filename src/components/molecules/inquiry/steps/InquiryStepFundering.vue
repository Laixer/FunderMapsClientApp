<template>
  <InquirySampleStep
    title="Fundering"
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
          v-model="fields.foundationType.value"
          v-bind="fields.foundationType"
          class="form-group--long"
        />
      </div>
    </div>
    <hr />
    <div class="form-row">
      <div class="col">
        <FormField
          v-model="fields.enforcementTerm.value"
          v-bind="fields.enforcementTerm"
        />
        <FormField
          v-model="fields.overallQuality.value"
          v-bind="fields.overallQuality"
        />
      </div>
      <div class="col">
        <FormField
          v-model="fields.damageCharacteristics.value"
          v-bind="fields.damageCharacteristics"
        />
        <FormField
          v-if="fields.damageCharacteristics.value !== null"
          v-model="fields.damageCause.value"
          v-bind="fields.damageCause"
        />
      </div>
    </div>
    <div class="form-row" v-if="isNoPile(fields.foundationType.value)">
      <div class="col">
        <FormField
          v-model="fields.foundationDepth.value"
          v-bind="fields.foundationDepth"
        />
      </div>
    </div>
  </InquirySampleStep>
</template>

<script>
import { decimal, numeric, maxLength, required } from "vuelidate/lib/validators";
import {
  enforcementTermOptions,
  damageCharacteristicsOptions,
  foundationQualityOptions,
  damageCauseOptions,
  foundationTypeOptions,
  isNoPile
} from "config/enums";
import Feedback from "atom/Feedback";

import InquirySampleStep from "molecule/inquiry/InquirySampleStep";
import FormField from "molecule/form/FormField";

import fields from "mixin/fields";

import { mapActions } from "vuex";

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
          validationRules: {
            numeric,
            required
          }
        },
        enforcementTerm: {
          label: "Handhavingstermijn",
          type: "select",
          value: null,
          options: [
            {
              value: null,
              text: "Selecteer een optie"
            }
          ].concat(
            enforcementTermOptions.filter(x =>
              [3, 4, 5, 6, 7].includes(x.value)
            )
          ),
          validationRules: {}
        },
        damageCharacteristics: {
          label: "Geconstateerde schade",
          type: "select",
          value: null,
          options: [
            {
              value: null,
              text: "Selecteer een optie"
            }
          ].concat(damageCharacteristicsOptions),
          validationRules: {}
        },
        overallQuality: {
          label: "Algehele funderingskwaliteit",
          type: "select", // TODO: int
          value: null,
          options: [
            {
              value: null,
              text: "Selecteer een optie"
            }
          ].concat(foundationQualityOptions),
          validationRules: {
            decimal,
            maxLength: maxLength(10)
          }
        },
        damageCause: {
          label: "Oorzaak funderingsschade",
          type: "select",
          value: null,
          options: [
            {
              value: null,
              text: "Selecteer een optie"
            }
          ].concat(damageCauseOptions),
          validationRules: {
            maxLength: maxLength(128)
          }
        },
        foundationDepth: {
          label: "Funderingsdiepte",
          type: "text", // TODO: int
          value: null,
          validationRules: {
            decimal,
            maxLength: maxLength(10)
          }
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
    isNoPile,
    ...mapActions("samples", ["updateSample", "createSample", "deleteSample"]),
    ...mapActions("address", ["getAddressById", "getAddressSuggestions"]),
    save(next) {
      const val = this.value;
      val.foundationType = this.fields.foundationType.value;
      val.enforcementTerm = this.fields.enforcementTerm.value;
      val.damageCharacteristics = this.fields.damageCharacteristics.value;
      val.overallQuality = this.fields.overallQuality.value;
      val.damageCause = this.fields.damageCharacteristics.value
        ? this.fields.damageCause.value
        : null;
      val.foundationDepth =
        isNoPile(this.value.foundationType)
          ? this.fields.foundationDepth.value
          : null;
      this.$emit("input", val);
      this.$emit("save", { sample: val, next: next });
    },
    async initialize(sample) {
      if (sample) {
        this.setFieldValues({
          foundationType: sample.foundationType,
          enforcementTerm: sample.enforcementTerm,
          damageCharacteristics: sample.damageCharacteristics,
          overallQuality: sample.overallQuality,
          damageCause: sample.damageCause,
          foundationDepth: sample.foundationDepth
        });
      }
    }
  }
};
</script>
