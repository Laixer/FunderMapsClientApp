<template>
  <div :class="{ 'SideBar--slim': slim }" class="SideBar d-flex flex-column">
    <div v-if="!slim && hasMenuItems" class="SideBar__title d-flex pl-3 ml-3">
      <span class="align-self-center"> MENU </span>
    </div>
    <SideMenu class="SideBar__sidemenu" :items="menuItems" :slim="slim" />
    <div v-if="version && !slim" class="SideBar__version">
      Versie: {{ version }}
    </div>
  </div>
</template>

<script>
import SideMenu from "molecule/SideMenu";
import { mapGetters } from "vuex";

export default {
  components: {
    SideMenu,
  },
  props: {
    menuItems: {
      type: Array,
      default: function () {
        return [];
      },
    },
    slim: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    ...mapGetters("version", ["version"]),
    hasMenuItems() {
      return this.menuItems.length > 0;
    },
  },
};
</script>

<style lang="scss">
.SideBar {
  overflow: hidden;
  position: relative;
  width: 250px;
  background: white;
  box-shadow: -1px 0px 0px 0px rgba(223, 226, 229, 1) inset;
  user-select: none;
  color: #7f8fa4;
  max-height: 100%;
  z-index: 1;
  left: 0;

  &--slim {
    width: 50px;
    overflow: hidden;
  }

  &__title {
    height: 60px;
  }

  &__sidemenu {
    flex-grow: 1;
  }

  &__version {
    // position: absolute;
    // bottom: 1rem;
    // left: 1rem;
    margin-bottom: 1rem;
    margin-left: 1rem;
    font-weight: 100;
  }
}
</style>
