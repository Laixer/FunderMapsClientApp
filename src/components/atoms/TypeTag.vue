<template>
  <div :style="typeStyles" class="TypeTag">{{ type.text }}</div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

@Component
export default class TypeTag extends Vue {
  @Prop() private readonly type!: any;

  get typeStyles(): object {
    return {
      color: this.type.color || "white",
      backgroundColor: this.type.bgColor,
    };
  }
}
</script>

<style>
.TypeTag {
  display: inline-block;
  border-radius: 3px;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  line-height: 1;
  padding: 6px 7px;
  user-select: none;
}
</style>
