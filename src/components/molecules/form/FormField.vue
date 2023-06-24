<template>
  <b-form-group class="FormField" :state="state">
    <!-- :label="label" -->
    <template v-slot:label v-if="type != 'checkbox'">
      <span>{{ label }}</span>
      <span v-if="hasInfo" v-b-tooltip.hover :title="info" class="explanation">
        <span>?</span>
      </span>
    </template>

    <b-form-select
      v-if="type === 'select'"
      v-model="fieldValue"
      :options="options"
      :state="state"
      :disabled="isDisabled"
      @input="handleInput"
      @blur="handleBlur"
    />

    <div
      class="FormField--choice d-flex align-items-center w-100"
      v-else-if="type === 'radio' && options.length === 2"
    >
      <b-form-radio
        class="check"
        v-model="fieldValue"
        :state="state"
        :disabled="isDisabled"
        @input="handleInput"
        @blur="handleBlur"
        :value="options[0].value"
      >
        {{ options[0].text }}
      </b-form-radio>
      <b-form-radio
        class="ml-3 none"
        v-model="fieldValue"
        :state="state"
        :disabled="isDisabled"
        @input="handleInput"
        @blur="handleBlur"
        :value="options[1].value"
      >
        {{ options[1].text }}
      </b-form-radio>
    </div>

    <div class="radio-images" v-else-if="type === 'radio-images'">
      <div
        class=""
        v-for="option in options"
        :key="option.value"
        :state="state"
        :disabled="isDisabled"
      >
        <input
          type="radio"
          v-model="fieldValue"
          :value="option.value"
          @input="handleInput($event.target.value)"
          @blur="handleBlur"
          :id="option.value"
        />
        <label class="radio-images__item" :for="option.value">
          <img :src="icon(option.icon)" />

          <span class="item-title">{{ option.text }}</span>
          <span class="item-check"></span>
        </label>
      </div>
    </div>

    <b-form-radio-group
      v-else-if="type === 'radio'"
      v-model="fieldValue"
      :options="options"
      :state="state"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :disabled="isDisabled"
      @input="handleInput"
      @blur="handleBlur"
    ></b-form-radio-group>

    <div class="image-checkbox" v-else-if="type === 'checkbox'">
      <!-- <b-form-checkbox
        v-model="fieldValue"
        :options="options"
        :state="state"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :disabled="isDisabled"
        @input="handleInput"
        @blur="handleBlur"
      >
      </b-form-checkbox> -->
      <input
        type="checkbox"
        v-model="fieldValue"
        @change="handleInput($event.target.checked)"
        @blur="handleBlur"
        :disabled="isDisabled"
        :id="label"
      />
      <label class="image-checkbox__item" :for="label">
        <img :src="icon(image)" />
        <span class="item-title">{{ label }}</span>
        <span class="item-check"></span>
      </label>
    </div>

    <!-- <v-date-picker
      locale="nl"
      :popover="{ visibility: 'click' }"
      v-else-if="type === 'datepicker'"
      @input="handleDatepickerInput"
      v-model="datepickerValue">
      <b-form-input 
        v-model="fieldValue" 
        type="text"
        :style="datepickerStyle"
        :state="state" 
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :disabled="isDisabled"
        @blur="handleDatepickerBlur"
        trim />
    </v-date-picker> -->

    <Datepicker
      v-else-if="type === 'datepicker'"
      :monday-first="true"
      :disabled="isDisabled"
      :language="nl"
      :input-class="state ? 'form-control is-valid' : 'form-control'"
      :value="fieldValue"
      :bootstrap-styling="true"
      @input="handleInput"
    ></Datepicker>

    <b-form-textarea
      v-else-if="type === 'textarea'"
      v-model="fieldValue"
      :state="state"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :disabled="isDisabled"
      @input="handleInput"
      @blur="handleBlur"
      :rows="rows"
      trim
    ></b-form-textarea>

    <b-form-file
      v-else-if="type === 'upload'"
      v-model="fieldValue"
      :state="state"
      :accept="accept"
      :browse-text="browseLabel"
      :placeholder="placeholder || 'Choose a file...'"
      :disabled="isDisabled"
      :drop-placeholder="dropInPlaceholder"
      @input="handleInput"
      @blur="handleBlur"
    ></b-form-file>

    <!-- TODO: Hide the listview if no items exist -->
    <vue-typeahead-bootstrap
      v-else-if="type === 'typeahead'"
      ref="typeahead"
      v-model="fieldValue"
      :prepend="prepend"
      :append="append"
      :state="state"
      :serializer="serializer"
      :placeholder="placeholder"
      :disabled="isDisabled"
      :data="data"
      :showAllResults="true"
      @input="handleInput"
      @blur="handleBlur"
      @hit="handleHit"
      trim
    ></vue-typeahead-bootstrap>

    <b-input-group v-else :prepend="prepend" :append="append">
      <b-form-input
        v-model="fieldValue"
        :type="type"
        :state="state"
        :accept="accept"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :disabled="isDisabled"
        @input="handleInput"
        @blur="handleBlur"
        trim
      />
    </b-input-group>

    <template slot="invalid-feedback">
      {{ invalidFeedback }}
    </template>
  </b-form-group>
</template>

<script>
import { validationMixin } from "vuelidate";
import { icon, image } from "helper/assets";

// TODO: https://github.com/charliekassel/vuejs-datepicker
// TODO: https://vue-multiselect.js.org

import Datepicker from "vuejs-datepicker";
import { nl } from "vuejs-datepicker/dist/locale";

export default {
  name: "FormField",
  inject: ["registerFormField"],
  components: { Datepicker },
  props: {
    value: {
      type: [String, Boolean, Number, Date, File],
      default: "",
    },
    label: {
      type: String,
      default: "",
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    /**
     * Field is always disabled
     */
    permaDisabled: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      default: "text",
    },
    autocomplete: {
      type: String,
      default: "off",
    },
    placeholder: {
      type: String,
      default: "",
    },
    validationRules: {
      type: Object,
      default: () => {
        return {};
      },
    },
    // Makes it possible to disable validation
    novalidate: {
      type: Boolean,
      default: false,
    },
    // Used by checkbox
    image: {
      type: String,
      default: null,
    },
    // Used by `type === select & radio`
    options: {
      type: Array,
      default: () => {
        return [];
      },
    },
    // Used by `type === typeahead`
    data: {
      type: Array,
      default: () => {
        return [];
      },
    },
    serializer: {
      type: Function,
      default: (d) => d,
    },
    // Used by `type === text`
    append: {
      type: String,
      default: "",
    },
    prepend: {
      type: String,
      default: "",
    },
    // Used by `type === textarea`
    rows: {
      type: Number,
      default: 5,
    },
    // Used by `type === upload`
    browseLabel: {
      type: String,
      default: "Browse",
    },
    dropInPlaceholder: {
      type: String,
      default: "Drop file here...",
    },
    accept: {
      type: String,
      default: null,
    },
    // Info icon in label
    info: {
      type: String,
      default: null,
    },
    infoHeader: {
      type: String,
      default: null,
    },
    infoHTML: {
      type: Boolean,
      default: false,
    },
  },
  mixins: [validationMixin],
  data() {
    return {
      fieldValue: "",
      blurred: false,
      nl, // Datepicker translation object
    };
  },
  computed: {
    state() {
      if (this.novalidate) {
        return null;
      }
      return this.$v.fieldValue.$dirty ? !this.$v.fieldValue.$error : null;
    },
    isDisabled() {
      return this.disabled || this.permaDisabled;
    },
    invalidFeedback() {
      let validator = this.$v.fieldValue;

      // Go over the validation rules, and return the
      // name of the first rule that is broken
      let match = Object.keys(this.validationRules).find(
        (rule) => !validator[rule]
      );
      if (match === -1) {
        return ""; // apparently no rules are broken?
      }

      let params = validator.$params;

      switch (match) {
        case "email":
          return "Voer a.u.b. een geldig e-mail adres in";
        case "required":
          return "Dit is een vereist veld";
        case "minLength":
          return (
            "Uw invoer moet minimaal " +
            params.minLength.min +
            " karakters zijn."
          );
        case "maxLength":
          return (
            "Uw invoer mag maximaal " +
            params.maxLength.max +
            " karakters zijn."
          );
        case "combinedHundred":
          return "De verdeling moet samen uit komen op 100%";
      }

      return "Controleer uw invoer a.u.b.";
    },
    hasInfo() {
      return this.info;
    },
  },
  watch: {
    /**
     * Observe changes to the value prop
     */
    value(newValue) {
      this.fieldValue = newValue;
    },
  },
  mounted() {
    // NOTE: Workaround. Cannot set value on typeahead via interface
    if (this.$refs.typeahead) {
      this.$refs.typeahead.inputValue = this.fieldValue;
    }
  },
  created() {
    // On creation, set the internal field value
    this.fieldValue = this.value;

    // If no value was passed, and this is a datepicker, default to today
    if (this.type === "datepicker" && !this.value) {
      this.$emit("input", new Date());
      this.resetValidation();
    }

    // If contained within a Form component, register the form field
    if (this.registerFormField) {
      this.registerFormField(this);
    }
  },
  /**
   * Vuelidate validation rules. Set through the validationRules prop
   */
  validations() {
    return this.validationRules ? { fieldValue: this.validationRules } : {};
  },
  methods: {
    /**
     * Info modal
     */
    icon,
    openInfo() {
      this.openModal({
        title: this.infoHeader,
        content: this.infoHTML
          ? this.$createElement("div", {
              domProps: {
                innerHTML: this.info,
              },
            })
          : this.info,
      });
    },
    openModal({ title, content }) {
      this.$bvModal.msgBoxOk(content, {
        title,
        okVariant: "secondary",
        headerClass: "pl-5",
        bodyClass: "pr-5 pl-5 pt-4 pb-4",
      });
    },

    // Start validation after initial blur
    handleBlur() {
      if (this.blurred === false) {
        this.validate();
      }
      this.blurred = true;
    },
    handleInput(value) {
      if (this.blurred || this.type === "select") {
        this.validate();
      }
      this.$emit("input", value);
    },
    handleHit(value) {
      this.$emit("hit", value);
    },
    validate() {
      if (!this.novalidate) {
        this.$v.$touch();
      }
    },
    isValid() {
      // Not ideal, but otherwise form processing would cancel
      return this.novalidate ? true : !!this.state;
    },
    resetValidation() {
      this.$v.$reset();
    },
  },
};
</script>
