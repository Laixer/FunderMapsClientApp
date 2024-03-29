<template>
  <div v-if="hasRequiredData" class="d-flex flex-column">
    <NavBar :admin="true" />
    <div class="d-flex align-items-stretch flex-grow-1">
      <SideBar :menu-items="menuItems" />
      <div class="flex-grow-1 d-flex flex-column">
        <HeaderBar />
        <div class="p-3 m-3 flex-grow">
          <slot />
        </div>
      </div>
    </div>
  </div>
  <div
    v-else
    class="d-flex flex-column justify-content-center align-items-center"
  >
    <div v-if="hasLoadingDataFailed" class="text-center">
      Refreshing data failed
      <br />
      <router-link :to="{ name: 'login' }"
        >Please renew your authentication</router-link
      >
    </div>
    <div v-else>Refreshing data, please wait...</div>
  </div>
</template>

<script>
import SideBar from "organism/SideBar";
import NavBar from "organism/NavBar";
import HeaderBar from "organism/HeaderBar";

import MenuItem from "model/MenuItem";

import { mapGetters, mapActions } from "vuex";

/**
 * The layout for the general user pages.
 *
 * This component also has a key task in ensuring that all critical data is
 * available that is required for the default layout. This is no longer a
 * task performed by the login component, because it also needs to trigger
 * upon a page refresh.
 *
 */
export default {
  components: {
    SideBar,
    NavBar,
    HeaderBar,
  },
  data() {
    return {
      loadingDataFailed: false,
      menuItems: [
        new MenuItem(
          "Organisaties",
          { name: "admin-organizations" },
          "Report-icon.svg"
        ),
        new MenuItem(
          "Aanmeldingen",
          { name: "admin-organization-proposals" },
          "Report-icon.svg"
        ),
      ],
    };
  },
  computed: {
    ...mapGetters("user", ["isUserAvailable"]),
    ...mapGetters("org", ["isOrganizationAvailable", "getOrgId"]),
    hasRequiredData() {
      return this.isUserAvailable && this.isOrganizationAvailable;
    },
    hasLoadingDataFailed() {
      return this.loadingDataFailed;
    },
  },
  async created() {
    try {
      await Promise.all([
        this.getUser(),
        this.getOrganization(),
        this.getVersion(),
      ]);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        await this.$router.push({ name: "login" });
      } else {
        this.loadingDataFailed = true;
      }
    }
  },
  methods: {
    ...mapActions("user", ["getUser"]),
    ...mapActions("org", ["getOrganization"]),
    ...mapActions("version", ["getVersion"]),
  },
};
</script>
