<template>
  <div
    :class="{ 'ProfileSetting__editMode': editMode }"
    class="ProfileSetting">
    <div class="ProfileSetting__text d-flex">
      <label class="d-inline-block font-weight-bold d-flex align-items-center">
        <span>{{ label }}</span>
      </label>
      <input
        v-if="editMode"
        class="form-control d-inline-block flex-grow-1"
        :type="type"
        :disabled="disabled"
        :value="value"
        :maxLength="maxLength"
        :max="max"
        :min="min"
        @input="$emit('input', $event.target.value)" />
      <span
        v-else
        class="d-inline-block flex-grow-1" >
        {{ value }}
      </span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProfileSettings',
  props: {
    value: {
      type: [String, Number],
      default: ''
    },
    type: {
      type: String,
      default: 'text'
    },
    label: {
      type: String,
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    },
    editMode: {
      type: Boolean,
      default: true
    },
    maxLength: {
      type: Number,
      default: 524288 // Default input field max length
    },
    max: {
      type: Number,
      default: 2147483647 // Max 32 bit integer. Javascript uses double-precision 64-bit integers. It's best to limit this manually
    },
    min: {
      type: Number,
      default: -2147483648 // Min 32 bit integer. Javascript uses double-precision 64-bit integers. It's best to limit this manually
    }
  }
}
</script>

<style lang="scss">
.ProfileSetting {
  border-bottom: 1px solid #E6EAEE;
  padding-bottom: 16px;
  padding-top: 18px;

  &:last-child {
    border: none;
  }
  &__editMode {
    border: none;
    padding-bottom: 10px;
    padding-top: 12px;
  }

  &__text {
    label {
      color: #354052;
      width: 125px;
      margin: 0;
    }
    input {
      // border: none;
      // padding: 0;
      font-size: 14px;
      height: auto;
      width: auto;
    }
    .form-control:disabled {
      background-color: #fff;
      cursor: not-allowed
    }
  }
}
</style>
