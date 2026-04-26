<script>
import { logout } from "service/auth";

export default {
  name: "Logout",
  async created() {
    await logout();
    this.$router.push({ name: "login" });
  },
  render(createElement) {
    return createElement();
  },
};
</script>
