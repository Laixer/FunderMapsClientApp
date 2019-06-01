<template>
  <div class="BasicDataItem d-flex flex-column">
    <strong>{{ label }}</strong>
    <span class="mt-2">{{ value }}</span>
  </div>
</template>

<script>
export default {
  name: 'BasicDataItem',
  props: {
    label: {
      type: String,
      required
    },
    value: {
      type: String,
      default: ''
    }
  }
}
</script>

<style lang="scss">
.BasicDataItem {
  strong {
    font-size: 16px;
    line-height: 1;
    font-weight: 400;
    color: #7F8FA4;
  }
  span {
    line-height: 19px;
    font-size: 16px;
    color: #354052;
  }
}
</style>
