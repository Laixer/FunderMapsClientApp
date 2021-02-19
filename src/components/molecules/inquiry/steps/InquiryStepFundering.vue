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
      <FormField
        v-model="fields.foundationType.value"
        v-bind="fields.foundationType"
      />
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
          v-if="fields.damageCharacteristics.value"
          v-model="fields.damageCause.value"
          v-bind="fields.damageCause"
        />
      </div>
    </div>
    <div class="form-row" v-if="fields.foundationType.value === 4">
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
import { decimal, maxLength, required } from "vuelidate/lib/validators";
import {
  enforcementTermOptions,
  damageCharacteristicsOptions,
  foundationQualityOptions,
  damageCauseOptions
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
          type: "radio-image",
          value: null,
          options: [
            {
              value: 0,
              text: "Houten palen"
            },
            {
              value: 10,
              text: "Houten palen oplanger"
            },
            {
              value: 3,
              text: "Betonnen palen"
            },
            {
              value: 4,
              text: "Niet onderheid"
            }
          ],
          validationRules: {
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
            decimal
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
            decimal
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
    ...mapActions("samples", ["updateSample", "createSample", "deleteSample"]),
    ...mapActions("address", ["getAddressById", "getAddressSuggestions"]),
    optionValue({ options, name }) {
      let key = this.value[name];
      return options[key] ? options[key].value : null;
    },
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
        this.value.foundationType === 4
          ? this.fields.foundationDepth.value
          : null;
      this.$emit("input", val);
      this.$emit("save", { sample: val, next: next });
    },
    async initialize(sample) {
      if (sample) {
        this.setFieldValues({
          foundationType: sample.foundationType ? sample.foundationType : null,
          enforcementTerm: sample.enforcementTerm
            ? sample.enforcementTerm
            : null,
          damageCharacteristics: sample.damageCharacteristics
            ? sample.damageCharacteristics
            : null,
          overallQuality: sample.overallQuality
            ? sample.overallQuality
            : null,
          damageCause: sample.damageCause ? sample.damageCause : null,
          foundationDepth: sample.foundationDepth
            ? sample.foundationDepth
            : null
        });
      }
    }
  }
};
</script>
