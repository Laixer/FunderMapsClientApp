<script>
import { logout } from 'service/auth';

export default {
  name: 'Logout',
  created() {

    logout()
    this.$router.push({ name: 'login' })
  },
  render(createElement) {
    return createElement();
  },
}
</script>
