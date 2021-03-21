<template>
  <label class="switch">
    <input
      :checked="value"
      type="checkbox"
      @change="$emit('input', $event.target.checked)"
    />
    <span class="slider round success"></span>
  </label>
</template>

<script>
export default {
  props: {
    value: {
      type: Boolean,
      default: true,
    },
  },
};
</script>

<style lang="scss">
/* The switch - the box around the slider */
.switch {
  position: relative;
  display: inline-block;
  width: 30px;
  height: 17px;

  /* Hide default HTML checkbox */
  input {
    display: none;
  }
}

/* The slider */
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  -webkit-transition: 0.4s;
  transition: 0.4s;

  &:before {
    position: absolute;
    content: "";
    height: 13px;
    width: 13px;
    left: 2px;
    bottom: 2px;
    background-color: white;
    -webkit-transition: 0.4s;
    transition: 0.4s;
  }

  /* Rounded sliders */
  &.round {
    border-radius: 17px;

    &:before {
      border-radius: 50%;
    }
  }
}

input {
  &:checked + .slider {
    &.default {
      background-color: #444;
    }
    &.primary {
      background-color: #2196f3;
    }
    &.success {
      background-color: #8bc34a;
    }
    &.info {
      background-color: #3de0f5;
    }
    &.warning {
      background-color: #ffc107;
    }
    &.danger {
      background-color: #f44336;
    }
  }
  &:focus + .slider {
    box-shadow: 0 0 1px #2196f3;
  }
  &:checked + .slider:before {
    transform: translateX(13px);
  }
}
</style>
