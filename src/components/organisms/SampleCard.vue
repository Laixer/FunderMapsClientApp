<template>
  <div class="SampleCard" :class="{ copy: sample.id == 0 }" @click="select()">
    <span class="SampleCard__title" :label="sample.address">{{
      sample.addressFormatted
      }}</span>

    <span class="SampleCard__actions">
      <a v-if="sample.id" class="SampleCard__open" @click.stop="copySample">
        <svg class="SampleCard__icon" height="10" viewBox="0 0 10 10" width="10" xmlns="http://www.w3.org/2000/svg">
          <path
            d="m348.995316 24.9976582h-4.98829c-.281032 0-.519125.0975785-.714286.2927393-.195161.1951609-.29274.4332536-.29274.714286v4.9882907c0 .2810319.097579.5191247.29274.7142857s.433254.2927401.714286.2927401h4.98829c.281033 0 .519126-.0975791.714286-.2927401.195161-.195161.29274-.4332538.29274-.7142857v-4.9882907c0-.2810324-.097579-.5191251-.29274-.714286-.19516-.1951608-.433253-.2927393-.714286-.2927393zm2.997659-2.9976582h-4.988291c-.281032 0-.519124.0975784-.714285.2927393-.195162.1951609-.292741.4332536-.292741.714286v.9953158h4.004684c.273226 0 .507415.0975798.702576.2927406.195161.1951609.29274.42935.29274.7025765v4.0046836h.995317c.281032 0 .519125-.0975785.714286-.2927407.195161-.1951608.292739-.4332535.292739-.7142846v-4.9882912c0-.2810324-.097578-.5191251-.292739-.714286s-.433254-.2927393-.714286-.2927393z"
            fill="" fill-rule="evenodd" transform="translate(-343 -22)" />
        </svg>
      </a>
      <a class="SampleCard__delete" @click.stop="deleteSample">
        <svg class="SampleCard__icon" xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">
          <path fill="" fill-rule="evenodd"
            d="m366.968421 28 2.863157 2.8186522c.11228.1105358.168422.2625205.168422.4559582 0 .193438-.056142.3592394-.168422.4974092-.308774.3039739-.617543.3039739-.926317 0l-2.863156-2.8186523-2.905263 2.8186523c-.308773.3039739-.617542.3039739-.926316 0-.140351-.1381698-.210526-.2901545-.210526-.4559585 0-.1934377.070175-.3592391.210526-.4974089l2.863158-2.8186522-2.863158-2.8186515c-.140351-.1381699-.210526-.3039717-.210526-.4974104 0-.1658043.070175-.3177878.210526-.4559576.308774-.303974.617543-.303974.926316 0l2.905263 2.818651 2.863156-2.818651c.308774-.303974.617543-.303974.926317 0 .11228.1381698.168422.3039717.168422.4974081 0 .1934386-.056142.3454245-.168422.4559599z"
            transform="translate(-362 -24)" />
        </svg>
      </a>
    </span>
  </div>
</template>

<script>
import { mapActions } from "vuex";

export default {
  props: {
    sample: {
      type: Object,
      required: true,
    },
    index: {
      type: Number,
      required: true,
    },
    editMode: {
      type: Boolean,
      default: false,
    },
  },
  computed: {},
  data() {
    return {
      addressId: null,
    };
  },
  methods: {
    ...mapActions("samples", ["setSelectedSample"]),
    select() {
      this.setSelectedSample(this.sample);
    },

    deleteSample() {
      this.$emit("delete", this.sample);
    },

    copySample() {
      this.$emit("copy", this.index);
    },
  },
};
</script>

<style lang="scss">
// @import "@/assets/scss/variables.scss";

.SampleCard {
  position: relative;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  padding: 15px 20px 20px;
  border-radius: 5px;
  background-color: $aqua-haze;
  border: 1px solid $mischka;
  transition: border-color ease-in-out 0.2s, box-shadow ease-in-out 0.1s,
    background-color ease-in-out 0.15s;
  cursor: pointer;

  &:hover {
    border: 1px solid $primary;
    box-shadow: 0 0 5px 0 rgba(23, 164, 234, 0.5);
    background-color: $white;

    .SampleCard {
      &__icon {
        fill: $primary;
      }
    }
  }

  &.copy {
    opacity: 0.6;
  }

  &+& {
    margin-top: 10px;
  }

  &.active {
    border: 1px solid $primary;
    background-color: $white;

    .SampleCard {
      &__icon {
        fill: $primary;
      }
    }
  }

  &__title {
    // @include text-ellipsis(1);
    color: $secondary;
    max-width: 85%;
  }

  &__actions {
    display: flex;
  }

  &__open {
    margin-right: 12px;
  }

  &__icon {
    fill: $regent-gray;
    transition: fill ease-in-out 0.2;
  }
}
</style>
