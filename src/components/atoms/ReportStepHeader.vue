<template>
  <div class="ReportStepHeader d-flex align-items-center justify-content-between">
    <h2 class="m-0 flex-grow-1">
      <span class="font-weight-bold">Stap {{ step }}</span>
      <span
        class="ReportStepHeader__label ml-3 pl-3"
        v-if="label">
        {{ label }}
      </span>
    </h2>
    <slot />
  </div>
</template>

<script>
export default {
  props: {
    step: {
      type: Number,
      default: 1
    },
    label: {
      type: String,
      default: null
    }
  }
}
</script>

<style lang="scss">
.ReportStepHeader {
  border-radius: 5px;
  background: white;
  height: 100px;
  width: 100%;
  border: 1px solid #CED0DA;
  padding: 0 30px;
  margin-bottom: 10px;

  h2 {
    line-height: 20px;
    font-size: 24px;
  }

  &__label {
    position: relative;
    font-size: 16px;

    &:before {
      position: absolute;
      content: '';
      border-left: 1px solid $athens-gray;
      height: 30px;
      left: 0;
      top: -50%;
    }
  }
  .btn {
    color: $regent-gray;

    &:hover, &:visited, &:active {
      color: darken($regent-gray, 10%)
    }
  }
}
</style>
