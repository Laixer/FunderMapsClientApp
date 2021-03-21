<template>
  <div
    class="ReportStepHeader d-flex align-items-center justify-content-between"
  >
    <h2 class="m-0 flex-grow-1">
      <span class="font-weight-bold">Stap {{ step }}</span>
      <span class="ReportStepHeader__label ml-3 pl-3" v-if="label">
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
      default: 1,
    },
    label: {
      type: String,
      default: null,
    },
  },
};
</script>

<style lang="scss">
.ReportStepHeader {
  border-radius: 5px;
  background: white;
  height: 100px;
  width: 100%;
  border: 1px solid #ced0da;
  padding: 0 30px;
  margin-bottom: 10px;

  h2 {
    line-height: 20px;
    font-size: 24px;
    color: #3d5372;
  }

  &__label {
    position: relative;
    font-size: 16px;

    &:before {
      position: absolute;
      content: "";
      border-left: 1px solid #e8eaf1;
      height: 30px;
      left: 0;
      top: -50%;
    }
  }
  .btn {
    color: #7f8fa4;

    &:hover,
    &:visited,
    &:active {
      color: darken(#7f8fa4, 10%);
    }
  }
}
</style>
