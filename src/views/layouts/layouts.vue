<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import emptyLayout from "./empty.vue";
import defaultLayout from "./default.vue";
import loginLayout from "./login.vue";

/**
 * Determines which layout to use based on the route meta data
 */
@Component({
  components: {
    emptyLayout,
    defaultLayout,
    loginLayout,
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
      case "empty":
        return createElement("emptyLayout", this.$slots.default);
      default:
        return createElement("defaultLayout", this.$slots.default);
    }
  }
}
</script>
