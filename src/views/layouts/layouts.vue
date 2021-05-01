<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import emptyLayout from "./empty.vue";
import defaultLayout from "./default.vue";
import adminLayout from "./admin.vue";
import loginLayout from "./login.vue";
import mapLayout from "./map.vue";

/**
 * Determines which layout to use based on the route meta data
 */
@Component({
  components: {
    emptyLayout,
    defaultLayout,
    adminLayout,
    loginLayout,
    mapLayout,
  },
})
export default class Layouts extends Vue {
  render(createElement: any) {
    let layout =
      this.$route.meta && this.$route.meta.layout
        ? this.$route.meta.layout
        : "default";

    switch (layout) {
      case "login":
        return createElement("loginLayout", this.$slots.default);
      case "admin":
        return createElement("adminLayout", this.$slots.default);
      case "empty":
        return createElement("emptyLayout", this.$slots.default);
      case "map":
        return createElement("mapLayout", this.$slots.default);
      default:
        return createElement("defaultLayout", this.$slots.default);
    }
  }
}
</script>
