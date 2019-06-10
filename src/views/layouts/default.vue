<template>
  <div 
    v-if="hasRequiredData" 
    class="d-flex flex-column">
    <NavBar />
    <div class="d-flex align-items-stretch flex-grow-1">
      <SideBar />
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
    class="d-flex flex-column justify-content-center align-items-center">
    <div 
      v-if="hasLoadingDataFailed" 
      class="text-center">
      Refreshing data failed <br/> 
      <router-link 
        :to="{ name: 'login'}">
        Please renew your authentication
      </router-link>
    </div>
    <div v-else>
      Refreshing data, please wait...
    </div>
  </div>
</template>

<script>
import SideBar from 'organism/SideBar';
import NavBar from 'organism/NavBar';
import HeaderBar from 'organism/HeaderBar';

import { mapGetters, mapActions } from 'vuex'

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
    SideBar, NavBar, HeaderBar
  },
  data() {
    return {
      loadingDataFailed: false
    }
  },
  computed: {
    ...mapGetters('user', [
      'isUserAvailable'
    ]),
    ...mapGetters('org', [
      'isOrganizationAvailable',
      'getOrgId'
    ]),
    ...mapGetters('orgUsers', [
      'areOrganisationUsersAvailable'
    ]),
    hasRequiredData() {
      return this.isUserAvailable 
        && this.isOrganizationAvailable
        && this.areOrganisationUsersAvailable
    },
    hasLoadingDataFailed() {
      return this.loadingDataFailed
    }
  },
  async created() {
    if ( ! this.isUserAvailable) {
      try {
        await this.getUser()
      } catch(err) {
        this.loadingDataFailed = true;
      }
    }
    if (
      ! this.loadingDataFailed &&
      ! this.isOrganizationAvailable
    ) {
      try {
        await this.getOrganization()
      } catch(err) {  
        this.loadingDataFailed = true;
      }
    }
    if ( 
      ! this.loadingDataFailed &&
      ! this.areOrganisationUsersAvailable
    ) {
      try {
        await this.getUsers({ orgId: this.getOrgId })
      } catch(err) {  
        this.loadingDataFailed = true;
      }
    }
  },
  methods: {
    ...mapActions('user', [
      'getUser'
    ]),
    ...mapActions('org', [
      'getOrganization'
    ]),
    ...mapActions('orgUsers', [
      'getUsers'
    ])
  }
}
</script>
