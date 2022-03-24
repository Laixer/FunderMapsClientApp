<template>
  <b-form-group class="FormField" :state="state">
    <!-- :label="label" -->
    <template v-slot:label v-if="type != 'checkbox'">
      <span>{{ label }}</span>
      <span v-if="hasInfo" class="info ml-1" @click="openInfo">
        <img
          style="margin-top: -2px; cursor: pointer"
          :src="icon('info-circle-light.svg')"
          width="16"
          height="16"
        />
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
      console.log(value);
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

<style lang="scss">
@import "@/assets/scss/variables.scss";

.FormField {
  font-size: 16px;
  position: relative;

  input {
    color: rgba(53, 64, 82, 0.5);
  }
  input:disabled {
    color: #495057 !important;
  }

  label,
  legend {
    color: #7f8fa4;
    text-transform: uppercase;
    padding-bottom: 0;
  }

  // .invalid-feedback {
  //   position: absolute;
  //   top: -1.75rem;
  //   text-align: right;
  // }

  &--choice {
    height: 33px;

    .custom-control-input:checked ~ .custom-control-label::before {
      border-color: transparent;
      background-color: transparent;
    }
    .custom-radio.check
      .custom-control-input:checked
      ~ .custom-control-label::after {
      background-color: white;
      background-image: url("../../../assets/icons/Check-icon.svg");
      background-size: cover;
    }
    .custom-radio.none
      .custom-control-input:checked
      ~ .custom-control-label::after {
      background-color: white;
      background-image: url("../../../assets/icons/None-icon.svg");
      background-size: cover;
    }
  }

  .vdp-datepicker {
    .form-control[readonly] {
      background-color: #fff;
    }
    &__calendar,
    .cell:hover,
    .selected {
      border-radius: 0.25rem;
    }
  }

  .image-checkbox {
    input {
      position: absolute;
      z-index: -1;
      opacity: 0;

      &:checked {
        + label {
          border-color: $shamrock;
          background-color: rgba($shamrock, 0.1);

          .item-check {
            &::before {
              transform: translate(0, 0);
            }

            &::after {
              opacity: 1;
            }
          }
        }
      }
    }

    &__item {
      background: $white;
      padding: 15px 15px 40px;
      text-align: center;
      position: relative;
      border: 1px solid $mischka;
      cursor: pointer;
      display: block;
      margin-bottom: 0;

      img {
        display: block;
        margin: auto;
      }

      .item-title {
        position: absolute;
        font-size: 14px;
        margin-top: 0.5rem;
        color: $raven;
        text-transform: none;
        left: 0;
        width: 100%;
      }

      .item-check {
        height: 40px;
        // opacity: 0;
        overflow: hidden;
        position: absolute;
        right: 0;
        top: 0;
        transition: opacity ease 0.28s;
        width: 40px;

        &::before,
        &::after {
          content: "";
          display: block;
          position: absolute;
        }

        &::before {
          border-style: solid;
          border-width: 0 40px 40px 0;
          border-color: transparent $shamrock transparent transparent;
          transition: transform ease 0.28s;
          transform: translate(100%, -100%);
          z-index: 1;
        }

        &::after {
          background-image: url("data:image/svg+xml,%3Csvg height='9' viewBox='0 0 12 9' width='12' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='m778.921953 293.707368-2.751221-2.65263-1.170732 1.13684 3.921953 3.808422 8.078047-7.84421-1.17073-1.15579z' fill='%23fff' fill-rule='evenodd' transform='translate(-775 -287)'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: center;
          z-index: 2;
          height: 9px;
          right: 5px;
          transition: opacity ease 0.28s 0.18s;
          opacity: 0;
          top: 6px;
          width: 12px;
        }
      }
    }
  }

  .radio-images {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;

    input {
      position: absolute;
      z-index: -1;
      opacity: 0;

      &:checked {
        + label {
          border-color: $shamrock;
          background-color: rgba($shamrock, 0.1);

          .item-check {
            &::before {
              transform: translate(0, 0);
            }

            &::after {
              opacity: 1;
            }
          }
        }
      }
    }

    &__item {
      background: $white;
      padding: 15px 15px 40px;
      text-align: center;
      position: relative;
      width: 100%;
      border: 1px solid $mischka;
      cursor: pointer;

      img {
        display: block;
        margin: auto;
      }

      .item-title {
        position: absolute;
        font-size: 14px;
        margin-top: 0.5rem;
        color: $raven;
        text-transform: none;
        left: 0;
        width: 100%;
      }

      .item-check {
        height: 40px;
        // opacity: 0;
        overflow: hidden;
        position: absolute;
        right: 0;
        top: 0;
        transition: opacity ease 0.28s;
        width: 40px;

        &::before,
        &::after {
          content: "";
          display: block;
          position: absolute;
        }

        &::before {
          border-style: solid;
          border-width: 0 40px 40px 0;
          border-color: transparent $shamrock transparent transparent;
          transition: transform ease 0.28s;
          transform: translate(100%, -100%);
          z-index: 1;
        }

        &::after {
          background-image: url("data:image/svg+xml,%3Csvg height='9' viewBox='0 0 12 9' width='12' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='m778.921953 293.707368-2.751221-2.65263-1.170732 1.13684 3.921953 3.808422 8.078047-7.84421-1.17073-1.15579z' fill='%23fff' fill-rule='evenodd' transform='translate(-775 -287)'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: center;
          z-index: 2;
          height: 9px;
          right: 5px;
          transition: opacity ease 0.28s 0.18s;
          opacity: 0;
          top: 6px;
          width: 12px;
        }
      }
    }
  }
}
</style>
