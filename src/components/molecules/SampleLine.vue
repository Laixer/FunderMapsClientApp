<template>
  <div
    :class="classList"
    class="SampleLine d-flex align-items-center"
    @click="togglePanel"
  >
    <span class="SampleLine__address flex-grow-1">
      {{ addressFormatted }}
    </span>

    <div
      v-if="editMode"
      class="SampleLine__edit d-flex align-items-center mr-3 pr-3"
    >
      <b-button
        v-if="open"
        size="sm"
        variant="outline-primary"
        class="mr-3"
        @click.stop="$emit('save')"
      >
        opslaan
      </b-button>
      <img
        :src="delIcon"
        width="16"
        height="16"
        @click.prevent.stop="$emit('delete')"
      />
    </div>

    <img :src="arrow" width="10" height="10" />
  </div>
</template>

<script>
import { icon } from "helper/assets";
import { mapActions } from "vuex";

export default {
  props: {
    addressId: {
      type: String,
      required: false,
    },
    open: {
      type: Boolean,
      required: true,
    },
    editMode: {
      type: Boolean,
      default: false,
    },
  },
  data: function () {
    return {
      address: null,
    };
  },
  computed: {
    classList() {
      return {
        // 'SampleLine--open': !! this.open,
        "SampleLine--edit": !!this.editMode,
      };
    },
    arrow() {
      let name = this.open ? "ArrowUp-icon.svg" : "ArrowDown-icon.svg";
      return icon(name);
    },
    delIcon() {
      return icon("Delete-icon.svg");
    },
    addressFormatted: function () {
      return this.address ? this.address.format() : "Nieuw adres";
    },
  },
  methods: {
    ...mapActions("address", ["getAddressById"]),
    icon,
    togglePanel() {
      this.$emit("toggle");
    },
  },
  watch: {
    async addressId() {
      if (this.addressId) {
        this.address = await this.getAddressById({ id: this.addressId });
      }
    },
  },
  async created() {
    if (this.addressId) {
      this.address = await this.getAddressById({ id: this.addressId });
    }
  },
};
</script>

<style lang="scss">
.SampleLine {
  height: 60px;
  padding: 0 30px;
  background-color: white;
  cursor: pointer;

  // &--open &__address {
  //   font-weight: 600;
  // }
  &__edit {
    border-right: 1px solid #e8eaf1;
    height: 30px;
  }
}
</style>
