<template>
  <div
    class="FormStep"
    :class="{
      'FormStep--active': active == 1,
    }"
  >
    <router-link
      :to="{ name: 'edit-report-2', params: { page: 2, step: step } }"
      class="FormStepDropdown"
    >
      <h5 class="FormStep__title">{{ title }}</h5>

      <span class="FormStepDropdown__indicator">
        <img :src="icon('Angle.svg')" />
      </span>
    </router-link>

    <div class="FormStepForm" v-if="active"></div>
  </div>
</template>

<script>
import { icon } from "helper/assets";

import Default from "organism/FormSteps/Default";
import Surrounding from "organism/FormSteps/Surrounding";

export default {
  components: {
    Default,
    Surrounding,
  },
  props: {
    sample: {
      type: Object,
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    form: {
      type: String,
      required: true,
    },

    active: {
      type: Boolean,
      required: true,
    },
    step: {
      type: Number,
      required: true,
    },
  },

  methods: {
    icon,
  },
};
</script>

<style lang="scss">
@import "@/assets/scss/variables.scss";
.FormStep {
  &--active {
    background-color: $white;
    border-radius: 5px;
    border: 1px solid $mischka;
  }

  &__title {
    display: inline-block;
    margin-bottom: 0;
    line-height: 26px;
    font-family: $font-family-base;
    font-weight: 400;
    color: $regent-gray;
    text-transform: capitalize;

    .page-renovate & {
      color: $secondary;
      font-size: $h5-font-size !important;
    }
  }
}

.FormStepDropdown {
  position: relative;
  display: inline-flex;
  padding: 30px 30px 30px 70px;
  margin-bottom: 0;
  width: 100%;
  text-decoration: none;
  justify-content: space-between;
  align-items: center;

  &::before {
    content: "";
    position: absolute;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: $mischka;
    opacity: 0.5;
    top: 25px;
    left: 25px;
  }

  // &::after {
  //   content: "";
  //   position: absolute;
  //   background-color: $mischka;
  //   width: 2px;
  //   height: 15px;
  //   top: -1px;
  //   left: 40px;
  // }

  .FormStep--active & {
    border-bottom: 1px solid $mischka;

    &::after {
      content: none;
    }

    &__icon {
      transform: rotate(0deg);
    }

    &__indicator {
      display: block;
    }
  }

  .FormStep--completed & {
    padding-bottom: 30px;

    &::before {
      opacity: 1;
      background-color: $shamrock;
      background-image: url("data:image/svg+xml,%3Csvg height='9' viewBox='0 0 12 9' width='12' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='m778.921953 293.707368-2.751221-2.65263-1.170732 1.13684 3.921953 3.808422 8.078047-7.84421-1.17073-1.15579z' fill='%23fff' fill-rule='evenodd' transform='translate(-775 -287)'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: center;
    }

    &::after {
      top: unset;
      bottom: -25px;
    }

    &__icon {
      transform: rotate(180deg);
    }

    &__indicator {
      display: block;
    }
  }

  &__indicator {
    display: none;
    padding-left: 20px;
    border-left: 1px solid $athens-gray;
  }

  &__icon {
    transform: rotate(180deg);
    transition: transform 0.28s ease;
  }
}
</style>
