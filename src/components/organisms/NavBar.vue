<template>
  <nav class="NavBar d-flex flex-row sticky-top">
    <div class="NavBar__logo">
      <router-link :to="{ name: 'dashboard' }">
        <Logo :company="company" />
      </router-link>
    </div>
    <b-nav class="d-flex flex-row-reverse flex-grow-1">
      <b-nav-item-dropdown v-if="!public" class="align-self-center mr-3" right>
        <template slot="button-content">
          <img v-if="user !== null" :src="user.getAvatar()" class="m1 rounded-circle" height="36" width="36"
            alt="Profile Menu" />
        </template>
        <b-dropdown-item v-for="(item, index) in menuItems" :key="index" :to="item.to">{{ item.label
          }}</b-dropdown-item>
      </b-nav-item-dropdown>
      <MapControls v-if="hasMapControls" />
    </b-nav>
  </nav>
</template>

<script>
import Logo from "atom/branding/Logo";
import MenuItem from "model/MenuItem";
import MapControls from "molecule/MapControls";

import { mapGetters } from "vuex";

export default {
  name: "NavBar",
  components: {
    Logo,
    MapControls,
  },
  props: {
    admin: {
      type: Boolean,
      default: false,
    },
    public: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      company: "FunderMaps",
      menuItems: [
        new MenuItem("Uitloggen", {
          name: "logout",
        }),
      ],
    };
  },
  computed: {
    ...mapGetters("user", ["user"]),
    hasMapControls() {
      return this.$route.meta.map;
    },
  },
};
</script>

<style lang="scss">
.NavBar {
  height: 70px;
  background: white;
  box-shadow: 0px -1px 0px 0px rgba(223, 226, 229, 1) inset;
  user-select: none;

  &__logo {
    width: 250px;
    height: 100%;
    padding: 20px 0 0 30px;
  }

  &__description {
    color: #7f8fa4;
  }

  .form-group {
    margin-bottom: 0;
  }
}
</style>
