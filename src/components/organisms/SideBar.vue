<template>
  <div class="SideBar">
    <div class="SideBar__title d-flex pl-3 ml-3">
      <span class="align-self-center">
        MENU
      </span>
    </div>
    <SideMenu :items="menuItems" />
    <div
      v-if="version"
      class="SideBar__version">
      Versie: {{ version }}
    </div>
  </div>
</template>

<script>
import SideMenu from 'molecule/SideMenu';
import { mapGetters } from 'vuex';

export default {
  components: {
    SideMenu
  },
  props: {
    menuItems: {
      type: Array,
      default: function() {
        return []
      }
    }
  },
  computed: {
    ...mapGetters('version', [
      'version'
    ])
  }
}
</script>

<style lang="scss">
.SideBar {
  position: relative;
  width: 250px;
  background: white;
  box-shadow: -1px 0px 0px 0px rgba(223,226,229,1) inset;
  user-select: none;
  color: #7F8FA4;
  max-height: 100%;

  &__title {
    height: 60px;
  }
  &__version {
    position: absolute;
    bottom: 1rem;
    left: 1rem;
  }
}
</style>
