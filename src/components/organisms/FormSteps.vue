<template>
  <div :key="selectedSample.id">
    <h1 class="h3">{{ addressFormatted }}</h1>

    <!-- <FormStep
      v-if="selectedSample"
      :sample="selectedSample"
      :title="'Algemeen'"
      :form="'Default'"
      :active="selectedStep == 1"
      :step="1"
    />

    <FormStep
      v-if="selectedSample"
      :sample="selectedSample"
      :title="'Omgeving'"
      :form="'Surrounding'"
      :active="selectedStep == 2"
      :step="2"
    /> -->

    <Default
      ref="step-1"
      :sample="selectedSample"
      :step="1"
      :active="selectedStep == 1"
    />
    <Surrounding
      ref="step-2"
      :sample="selectedSample"
      :step="2"
      :active="selectedStep == 2"
    />
  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex";

import Default from "organism/FormSteps/Default";
import Surrounding from "organism/FormSteps/Surrounding";

export default {
  components: {
    Default,
    Surrounding,
  },

  beforeRouteUpdate(to, from, next) {
    console.log("before route update");
    next();
  },

  async created() {
    this.selectedStep = this.$route.params.step;

    if (this.selectedSample.address) {
      this.address = await this.getAddressById({
        id: this.selectedSample.address,
      });
    }
  },

  data() {
    return {
      selectedStep: 1,
      address: null,
    };
  },

  watch: {
    "$route.params.step": {
      handler: function(step) {
        // console.log("save meee");
        this.selectedStep = step;
      },
    },
    // selectedSample: {
    //   handler: function(sample) {
    //     // console.log("Sub: " + this.selectedSample.substructure);

    //   },
    //   immediate: true,
    // },
  },

  computed: {
    ...mapGetters("samples", ["selectedSample"]),
    addressFormatted: function() {
      console.log(this.address);
      return this.address ? this.address.format() : "Nieuw adres";
    },
  },

  methods: {
    ...mapActions("address", ["getAddressById"]),
    // save(step) {
    //   this.$refs[`step-${step}`].save(false);
    // },
  },
};
</script>

<style lang="scss">
@import "@/assets/scss/form-step.scss";
</style>
