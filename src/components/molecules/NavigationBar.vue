<template>
  <div class="NavigationBar">
    <div class="container">
      <div class="row">
        <div class="col-6 text-right">
          <router-link v-if="prev" :to="prev" class="btn btn-prev"
            >Vorige</router-link
          >
        </div>
        <div class="col-6 text-left" v-if="next">
          <router-link :to="next" class="btn btn-next">Volgende</router-link>
        </div>
        <div v-else class="col-6 text-left">
          <slot></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "NavigationBar",
  props: {
    prev: {
      type: [Object, String],
      default: function () {
        return "";
      },
    },
    next: {
      type: [Object, String],
      default: function () {
        return "";
      },
    },
  },
};
</script>

<style lang="scss">
@import "@/assets/scss/variables.scss";
.NavigationBar {
  position: fixed;
  padding: 38px 0;
  bottom: 0;
  left: 0;
  width: calc(100% - 250px);
  left: 250px;
  background-color: $white;
  z-index: 9;
  border-top: 1px solid $mischka;
}
</style>
