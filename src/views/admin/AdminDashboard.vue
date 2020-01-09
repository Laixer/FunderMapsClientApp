<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

@Component
export default class AdminDashboard extends Vue {
  async created() {
    await this.$router.push({ name: "admin-organizations" });
  }
  render(createElement: any): any {
    return createElement();
  }
}
</script>
