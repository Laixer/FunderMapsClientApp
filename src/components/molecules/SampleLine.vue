<template>
  <div
    class="address-card"
    @click="togglePanel">

    <span class="address-card__title" v-if="address" :title="address.format()">
      {{ address.format() }}
    </span>

    <span class="address-card__title" v-else title="Nieuw adres">Nieuw adres</span>

    <span
      v-if="editMode"
      class="address-card__actions">
      <b-button
        v-if="open"
        size="sm"
        variant="outline-primary"
        class="mr-3"
        @click.stop="$emit('save')">
        opslaan
      </b-button>
      <img
        :src="delIcon"
        width="16"
        height="16"
        @click.prevent.stop="$emit('delete')" />
    </span>

      <div class="address-card__progress">
         <div class="address-card__progress-indicator--2"></div>
      </div>
  </div>
</template>

<script>

import { icon } from 'helper/assets'
import { mapActions } from 'vuex'

export default {
  props: {
    addressId: {
      type: String,
      required: false
    },
    open: {
      type: Boolean,
      required: true
    },
    editMode: {
      type: Boolean,
      default: false
    }
  },
  data: function() {
    return {
      address: null
    }
  },
  computed: {
    // classList() {
    //   return {
    //     // 'SampleLine--open': !! this.open,
    //     'SampleLine--edit': !! this.editMode
    //   }
    // },
    arrow() {
      let name = this.open
        ? 'ArrowUp-icon.svg'
        : 'ArrowDown-icon.svg'
      return icon(name);
    },
    delIcon() {
      return icon('Delete-icon.svg');
    }
  },
  methods: {
    ...mapActions('address', ['getAddressById']),
    icon,
    togglePanel() {
      this.$emit('toggle');
    }
  },
  watch: {
    async addressId() {
      if (this.addressId) {
        this.address = await this.getAddressById({ id: this.addressId })
      }
    }
  },
  async created() {
    if (this.addressId) {
      this.address = await this.getAddressById({ id: this.addressId })
    }
  }
}
</script>

<style lang="scss">

</style>
