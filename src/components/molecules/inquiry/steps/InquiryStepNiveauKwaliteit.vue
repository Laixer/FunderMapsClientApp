<template>
  <InquirySampleStep
    title="Niveau & Kwaliteit"
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
          v-model="fields.masonQuality.value"
          v-bind="fields.masonQuality"
        />
      </div>
      <div class="col">
        <FormField
          v-model="fields.masonLevel.value"
          v-bind="fields.masonLevel"
        />
      </div>
    </div>
    <hr />
    <template v-if="value && isWood(value.foundationType)">
      <div class="form-row">
        <div class="col">
          <FormField
            v-model="fields.constructionPile.value"
            v-bind="fields.constructionPile"
          />
          <FormField
            v-model="fields.constructionLevel.value"
            v-bind="fields.constructionLevel"
          />
        </div>
        <div class="col">
          <FormField
            v-model="fields.constructionQuality.value"
            v-bind="fields.constructionQuality"
          />
          <FormField
            v-model="fields.woodLevel.value"
            v-bind="fields.woodLevel"
          />
        </div>
      </div>
      <hr />
    </template>
    <div class="form-row">
      <div class="col">
        <FormField
          v-model="fields.thresholdFrontLevel.value"
          v-bind="fields.thresholdFrontLevel"
        />
      </div>
      <div class="col">
        <FormField
          v-model="fields.thresholdBackLevel.value"
          v-bind="fields.thresholdBackLevel"
        />
      </div>
    </div>
  </InquirySampleStep>
</template>

<script>
import { decimal, maxValue, minValue } from "vuelidate/lib/validators";
import { constructionPile, quality, isWood } from "config/enums";
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
        masonQuality: {
          label: "Kwaliteit metselwerk paal",
          type: "select",
          value: null,
          options: [
            {
              value: null,
              text: "Selecteer een optie"
            }
          ].concat(quality),
          validationRules: {}
        },
        masonLevel: {
          label: "Niveau onderkant metselwerk",
          type: "text", // TODO: int
          value: null,
          validationRules: {
            decimal,
            maxValue: maxValue(999),
            minValue: minValue(-999)
          }
        },
        constructionPile: {
          label: "Funderingsbalk",
          type: "select",
          value: null,
          options: [
            {
              value: null,
              text: "Selecteer een optie"
            }
          ].concat(constructionPile),
          validationRules: {}
        },
        constructionQuality: {
          label: "Kwaliteit funderingsbalk",
          type: "select",
          value: null,
          options: [
            {
              value: null,
              text: "Selecteer een optie"
            }
          ].concat(quality),
          validationRules: {}
        },
        constructionLevel: {
          label: "Niveau onderkant funderingsbalk",
          type: "text", // TODO: int
          value: null,
          validationRules: {
            decimal,
            maxValue: maxValue(999),
            minValue: minValue(-999)
          }
        },
        woodLevel: {
          label: "Niveau bovenkant funderingsbalk",
          type: "text", // TODO: int
          value: null,
          validationRules: {
            decimal,
            maxValue: maxValue(999),
            minValue: minValue(-999)
          }
        },
        thresholdFrontLevel: {
          label: "Drempelniveau voorgevel",
          type: "text", // TODO: int
          value: null,
          validationRules: {
            decimal,
            maxValue: maxValue(999),
            minValue: minValue(-999)
          }
        },
        thresholdBackLevel: {
          label: "Drempelniveau achtergevel",
          type: "text", // TODO: int
          value: null,
          validationRules: {
            decimal,
            maxValue: maxValue(999),
            minValue: minValue(-999)
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
    isWood,
    save(next) {
      const val = this.value;
      val.masonQuality = this.fields.masonQuality.value;
      val.masonLevel = this.fields.masonLevel.value;
      val.constructionPile = this.value
        ? isWood(this.value.foundationType)
          ? this.fields.constructionPile.value
          : null
        : null;
      val.constructionQuality = this.value
        ? isWood(this.value.foundationType)
          ? this.fields.constructionQuality.value
          : null
        : null;
      val.constructionLevel = this.value
        ? isWood(this.value.foundationType)
          ? this.fields.constructionLevel.value
          : null
        : null;
      val.woodLevel = this.value
        ? isWood(this.value.foundationType)
          ? this.fields.woodLevel.value
          : null
        : null;
      val.thresholdFrontLevel = this.fields.thresholdFrontLevel.value;
      val.thresholdBackLevel = this.fields.thresholdBackLevel.value;

      this.$emit("input", val);
      this.$emit("save", { sample: val, next: next });
    },
    async initialize(sample) {
      if (sample) {
        this.setFieldValues({
          masonQuality: sample.masonQuality,
          masonLevel: sample.masonLevel,
          constructionPile: sample.constructionPile,
          constructionQuality: sample.constructionQuality,
          constructionLevel: sample.constructionLevel,
          woodLevel: sample.woodLevel,
          thresholdFrontLevel: sample.thresholdFrontLevel,
          thresholdBackLevel: sample.thresholdBackLevel
        });
      }
    }
  }
};
</script>
