<template>
  <div style="display: contents">
    <div class="ProgressIndicator" :class="statusClass">
      <router-link :to="{ name: to }" class="ProgressIndicator__link">
        <img v-if="iconName" :src="icon(iconName)" />
        <span class="h6 ProgressIndicator__title">{{ title }}</span>
      </router-link>
    </div>
    <div v-if="!last" class="ProgressSpacer"></div>
  </div>
</template>

<script>
import { icon } from "helper/assets";

export default {
  name: "ProgressIndicator",
  props: {
    status: {
      type: String,
      default: "disabled",
      validator(value) {
        return ["disabled", "active", "passed"].includes(value);
      },
    },
    clickable: {
      type: Boolean,
      default: false,
    },
    step: {
      type: Number,
      default: 1,
    },
    title: {
      type: String,
      default: "",
    },
    iconName: {
      type: [String, Boolean],
      default: false,
    },
    last: {
      default: false,
    },
    to: {
      default: false,
    },
  },
  computed: {
    statusClass() {
      let cls = {};
      cls["ProgressIndicator--" + this.status] = true;
      return cls;
    },
  },
  methods: {
    icon,
  },
};
</script>

<style lang="scss">
@import "@/assets/scss/variables.scss";
.ProgressIndicator {
  position: relative;
  padding-right: 30px;
  height: 40px;
  display: inline-flex;
  align-items: center;

  &--active {
    .ProgressIndicator {
      &__title {
        font-weight: 600;
        color: $primary;
      }

      &__link {
        img {
          filter: grayscale(0);
        }
      }
    }

    &::after {
      content: "";
      position: absolute;
      width: 100%;
      height: 2px;
      bottom: -10px;
      left: 0;
      background-color: $primary;
    }
  }

  &--passed {
    .ProgressIndicator {
      &__fill {
        fill: $regent-gray;
      }
    }

    &::after {
      content: "";
      position: absolute;
      width: 12px;
      height: 9px;
      right: -15px;
      background-image: url("data:image/svg+xml,%3Csvg height='10' viewBox='0 0 12 10' width='12' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='m456.921953 31.9073174-2.751221-2.7317059-1.170732 1.1707301 3.921953 3.9219525 8.078047-8.0780497-1.17073-1.1902444z' fill='%237f8fa4' fill-rule='evenodd' transform='translate(-453 -25)'/%3E%3C/svg%3E");
    }
  }

  &__title {
    margin-bottom: 0;
    line-height: 20px;
    font-family: $font-family-base;
    font-weight: normal;
    color: $regent-gray;
  }

  &__icon {
    margin-right: 15px;
  }

  &__link {
    text-decoration: none;
    display: inline-block;

    img {
      height: 24px;
      margin-right: 15px;
      filter: grayscale(1);
    }

    &:hover {
      text-decoration: none;

      .ProgressIndicator {
        &__title {
          text-decoration: none;
          color: $secondary;
        }
      }
    }

    .ProgressIndicator--active &:hover {
      .ProgressIndicator__title {
        color: $primary;
      }
    }
  }

  &__fill {
    fill: $regent-gray;
  }
}

.ProgressSpacer {
  display: inline-block;
  list-style-type: none;
  background-image: url("data:image/svg+xml,%3Csvg height='3' viewBox='0 0 30 3' width='30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='m781 100.996-30 .004' fill='none' stroke='%23ced0da' stroke-width='2' transform='translate(-751 -99)'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
  max-width: 30px;
  width: 100%;
}
</style>
