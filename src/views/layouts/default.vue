<template>
  <div v-if="hasRequiredData" class="d-flex flex-column">
    <NavBar />
    <div class="d-flex align-items-stretch flex-grow-1">
      <SideBar :menu-items="menuItems" />
      <div class="flex-grow-1 d-flex flex-column">
        <HeaderBar />
        <div
          :class="[
            isFullScreen
              ? 'flex-grow h-100 position-relative'
              : 'flex-grow p-3 m-3',
          ]"
        >
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
    <div v-else>
      <div class="d-flex align-items-center">
        <div
          class="spinner-border ml-auto text-primary"
          style="width: 3rem; height: 3rem"
          role="status"
          aria-hidden="true"
        ></div>
        <span class="m-3">Refreshing data, please wait...</span>
      </div>
    </div>
  </div>
</template>

<script>
import SideBar from "organism/SideBar";
import NavBar from "organism/NavBar";
import HeaderBar from "organism/HeaderBar";

import MenuItem from "model/MenuItem";

import { isSuperUser } from "service/auth";
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
          "Dashboard",
          { name: "dashboard" },
          "Home-icon.svg",
          "Home-icon-active.svg"
        ),
        new MenuItem(
          "Rapportages",
          { name: "reports" },
          "Report-icon.svg",
          "Report-icon-active.svg"
        ),
        // new MenuItem(
        //   "Kaart",
        //   { name: "map" },
        //   "Map-icon.svg",
        //   "Map-icon-active.svg"
        // ),
      ],
    };
  },
  computed: {
    ...mapGetters("user", ["isUserAvailable"]),
    ...mapGetters("org", ["isOrganizationAvailable", "getOrgId"]),
    ...mapGetters("contractors", ["areContractorsAvailable"]),
    hasRequiredData() {
      return (
        this.isUserAvailable &&
        this.isOrganizationAvailable &&
        this.areContractorsAvailable
      );
    },
    hasLoadingDataFailed() {
      return this.loadingDataFailed;
    },
    isFullScreen() {
      return this.$route.meta.fullscreen;
    },
  },
  async created() {
    if (isSuperUser()) {
      this.menuItems.push(
        new MenuItem(
          "Organisatie",
          { name: "organization" },
          "Tools-icon.svg",
          "Tools-icon-active.svg"
        )
      );
    }

    try {
      await Promise.all([
        this.getUser(),
        this.getOrganization(),
        this.getContractors(),
        this.getVersion(),
      ]);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        this.$router.push({ name: "login" });
      } else {
        this.loadingDataFailed = true;
      }
    }
  },
  methods: {
    ...mapActions("user", ["getUser"]),
    ...mapActions("org", ["getOrganization"]),
    ...mapActions("version", ["getVersion"]),
    ...mapActions("contractors", ["getContractors"]),
  },
};
</script>
