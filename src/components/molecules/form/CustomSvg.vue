<template>
  <div>
    {{ this.svg }}
  </div>
</template>

<script>
export default {
  props: {
    path: {
      type: String,
      default: null,
    },
  },

  data() {
    return {
      svg: require("@/assets/icons/" + this.path),
    };
  },

  created() {
    this.svg = require("@/assets/icons/" + this.path + "?inline");
    // this.svg = require(`!html-loader! @/assets/icons/${this.path}`);
    console.log(this.svg);
  },

  computed: {
    externalSVG() {
      return this.svg;
    },
  },
};
</script>
