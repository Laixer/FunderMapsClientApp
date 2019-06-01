<template>
  <div class="ProfileSetting">
    <div class="ProfileSetting__text d-flex">
      <label class="d-inline-block font-weight-bold">
        {{ label }}
      </label>
      <input 
        class="form-control d-inline-block flex-grow-1" 
        type="text" 
        :disabled="disabled"
        :value="value"
        @input="$emit('input', $event.target.value)" />
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProfileSettings',
  props: {
    value: {
      type: String,
      default: ''
    },
    label: {
      type: String,
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
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

  &__text {
    label {
      color: #354052;
      width: 125px;
      margin: 0;
    }
    input {
      border: none;
      padding: 0;
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
