<template>
  <span :class="`badge badge-${type.color}`">{{ type.text }}</span>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

@Component
export default class TypeTag extends Vue {
  @Prop() private readonly type!: any;
}
</script>

<style lang="scss" scoped>
.badge {
  display: inline-block;
  font-size: 14px;
  text-transform: uppercase;
  padding: 8px;
  user-select: none;
}
</style>
