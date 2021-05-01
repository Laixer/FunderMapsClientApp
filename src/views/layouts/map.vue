<template>
  <div class="d-flex flex-column">
    <NavBar :public="true" />
    <div class="d-flex align-items-stretch flex-grow-1">
      <SideBar />
      <div class="flex-grow-1 d-flex flex-column">
        <HeaderBar />
        <div class="flex-grow h-100 position-relative">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import SideBar from "organism/SideBar";
import NavBar from "organism/NavBar";
import HeaderBar from "organism/HeaderBar";

/**
 * The layout for public maps.
 */
export default {
  components: {
    SideBar,
    NavBar,
    HeaderBar,
  },
};
</script>
