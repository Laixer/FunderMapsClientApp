<template>
  <div>
    <Feedback :feedback="feedback" />
    <div class="address-bar">
      {{ activeSample }}
      <InquirySampleCard
        v-for="(sample, index) in samples"
        :ref="'sample_' + index"
        :key="index + '-' + Date.now()"
        :sample="sample"
        :is-active="value ? value.id === sample.id : false"
        @click.native="$emit('input', sample)"
      />
    </div>
  </div>
</template>

<script>
import SampleModel from "model/Sample";
import Feedback from "atom/Feedback";
import InquirySampleCard from "molecule/inquiry/InquirySampleCard";

export default {
  name: "InquirySampleCardList",
  components: {
    Feedback,
    InquirySampleCard,
  },
  props: {
    value: {
      type: Object,
      default: null
    },
    samples: {
      type: Array,
      default: () => []
    },
    feedback: {
      type: Object,
      default: () => {}
    },
  }
};
</script>

<style lang="scss">
@import "@/sass/common/common";

.address-bar {
  &::-webkit-scrollbar-track {
    background: none;
    border-radius: 4px;
  }

  &::-webkit-scrollbar {
    width: 36px;
  }
  &::-webkit-scrollbar-thumb {
    border-left: 15px solid rgba(0, 0, 0, 0);
    border-right: 15px solid rgba(0, 0, 0, 0);
    background-clip: padding-box;
    height: 60px;
    -webkit-border-radius: 10px;
    background-color: $regent-gray;
  }
}
</style>
