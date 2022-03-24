<template>
  <div :key="selectedSample.id">
    <h1 class="h3">{{ selectedSample.addressFormatted }}</h1>

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
    <Foundation
      ref="step-2"
      :sample="selectedSample"
      :step="3"
      :active="selectedStep == 3"
    />

    <Poles
      ref="step-2"
      :sample="selectedSample"
      :step="4"
      :active="selectedStep == 4"
    />

    <Quality
      ref="step-2"
      :sample="selectedSample"
      :step="5"
      :active="selectedStep == 5"
    />

    <Cracks
      ref="step-2"
      :sample="selectedSample"
      :step="6"
      :active="selectedStep == 6"
    />

    <Deformation
      ref="step-2"
      :sample="selectedSample"
      :step="7"
      :active="selectedStep == 7"
    />
  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex";

import Default from "organism/FormSteps/Default";
import Surrounding from "organism/FormSteps/Surrounding";
import Foundation from "organism/FormSteps/Foundation";
import Poles from "organism/FormSteps/Poles";
import Quality from "./FormSteps/Quality.vue";
import Deformation from "./FormSteps/Deformation.vue";
import Cracks from "./FormSteps/Cracks.vue";

export default {
  components: {
    Default,
    Surrounding,
    Foundation,
    Poles,
    Quality,
    Deformation,
    Cracks,
  },

  beforeRouteUpdate(to, from, next) {
    console.log("before route update");
    next();
  },

  async created() {
    this.selectedStep = this.$route.params.step;
  },

  data() {
    return {
      selectedStep: 1,
      address: null,
    };
  },

  watch: {
    "$route.params.step": {
      handler: function (step) {
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
    // addressFormatted: function() {
    //   console.log(this.address);
    //   return this.address ? this.address.format() : "Nieuw adres";
    // },
  },

  methods: {
    // ...mapActions("address", ["getAddressById"]),
    // save(step) {
    //   this.$refs[`step-${step}`].save(false);
    // },
  },
};
</script>

<style lang="scss">
@import "@/assets/scss/form-step.scss";
</style>
