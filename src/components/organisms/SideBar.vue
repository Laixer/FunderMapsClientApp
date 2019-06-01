<template>
  <div class="SideBar">
    <div class="SideBar__title d-flex pl-3 ml-3">
      <span class="align-self-center">
        MENU
      </span>
    </div>
    <SideMenu :items="menuItems" />
  </div>
</template>

<script>
import SideMenu from 'molecule/SideMenu';
import MenuItem from 'model/MenuItem';

export default {
  components: {
    SideMenu
  },
  data() {
    return {
      menuItems: [
        new MenuItem({
          label: 'Dashboard',
          icon: 'Home-icon.svg',
          to: { name: 'dashboard' }
        }),
        new MenuItem({
          label: 'Rapportages',
          icon: 'Report-icon.svg',
          to: { name: 'reports' }
        }),
        // new MenuItem({
        //   label: 'Hersteld',
        //   icon: 'Tools-icon.svg'
        // }),
        // new MenuItem({
        //   label: 'Meldingen',
        //   icon: 'Alarm-icon.svg',
        //   notifications: 2
        // }),
        // new MenuItem({
        //   label: 'Kaarten',
        //   icon: 'Map-icon.svg',
        //   notifications: 102
        // }),
        // new MenuItem({
        //   label: 'Apps',
        //   icon: 'App-icon.svg'
        // })
      ]
    }
  }
}
</script>

<style lang="scss">
.SideBar {
  width: 250px;
  background: white;
  box-shadow: -1px 0px 0px 0px rgba(223,226,229,1) inset;
  user-select: none;
  color: #7F8FA4;

  &__title {
    height: 60px;
  }
}
</style>
