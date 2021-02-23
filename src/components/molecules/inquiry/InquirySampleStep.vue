<template>
  <div
    :class="`upload-step${isActive ? ' upload-step--active' : ''}${
      isCompleted ? ' upload-step--completed' : ''
    }`"
  >
    <a class="upload-step-dropdown" @click="$emit('select')">
      <h5 class="upload-step__title">{{ title }}</h5>

      <span class="upload-step-dropdown__indicator">
        <svg
          class="upload-step-dropdown__icon"
          height="4"
          viewBox="0 0 7 4"
          width="7"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="m1461.53323 291.999594-.0267-.002594-.05917-.004756c-.20393-.035723-.36473-.191545-.40175-.398378l-.00206-.006189-.00802-.087677.002-.026.00003-3.976301c0-.24433.18311-.447539.41192-.48968l.08768-.008019c.27592 0 .49959.214844.49959.497699l-.00022 3.502301 3.50131.000406c.24433 0 .44753.183107.48968.411917l.00801.087677c0 .275918-.21484.499594-.49769.499594z"
            fill="#354052"
            fill-rule="evenodd"
            transform="matrix(.70710678 .70710678 .70710678 -.70710678 -1236.047922 -826.668342)"
          />
        </svg>
      </span>
    </a>

    <Form ref="form" class="upload-form" v-if="isActive" @submit="handleSubmit">
      <Feedback :feedback="feedback" />
      <slot />
      <a @click.prevent.stop="next" class="btn btn-continue"
        >{{ lastStep ? "Gereed" : "Verder" }}
      </a>
    </Form>
  </div>
</template>

<script>
import Form from "molecule/form/Form";
import Feedback from "atom/Feedback";

export default {
  name: "InquirySampleStep",
  components: {
    Form,
    // FormField,
    // Divider,
    Feedback,
  },
  props: {
    title: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    lastStep: {
      type: Boolean,
      default: false,
    },
    feedback: {
      type: Object,
      default: () => {},
    },
  },
  methods: {
    next() {
      this.$refs.form.submit();
    },
    handleSubmit() {
      this.$emit("save", true);
    },
  },
  mounted() {
    this.$nextTick(() => {
      if (this.$refs.form) {
        this.$refs.form.resetValidation();
      }
    });
  },
  data() {
    return {
      isDisabled: false,
      stored: false,
    };
  },
};
</script>
