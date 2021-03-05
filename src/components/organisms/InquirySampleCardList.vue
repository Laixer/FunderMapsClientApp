<template>
  <div>
    <Feedback :feedback="feedback" />
    <div class="address-bar">
      <InquirySampleCard
        v-for="(sample, index) in samples"
        :ref="'sample_' + index"
        :key="index + '-' + Date.now()"
        :sample="sample"
        :can-delete="samples.length > 1"
        :is-active="isActive(sample)"
        @click.native="select(sample)"
      />
    </div>
  </div>
</template>

<script>
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
      default: null,
    },
    samples: {
      type: Array,
      default: () => [],
    },
    feedback: {
      type: Object,
      default: () => {},
    },
  },
  created() {
    if (!this.value && this.samples.length) {
      this.$emit("input", this.samples[this.samples.length - 1]);
    }
  },
  watch: {
    samples(newVal, oldVal) {
      if (newVal.length > oldVal.length) {
        this.$emit("input", newVal[newVal.length - 1]);
      } else {
        if (this.value) {
          if (!newVal.includes(this.value))
            this.$emit("input", newVal[newVal.length - 1]);
        }
      }
    },
  },
  methods: {
    select(sample) {
      if (sample !== this.value) {
        this.$emit("input", sample);
      }
    },
    isActive(sample) {
      if (this.value) {
        if (this.value.id) {
          return this.value.id === sample.id;
        } else if (this.value.creationstamp) {
          return this.value.creationstamp === sample.creationstamp;
        }
      }
      return false;
    },
  },
};
</script>

<style lang="scss">
.address-bar {
  display: flex;
  flex-direction: column-reverse;

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
