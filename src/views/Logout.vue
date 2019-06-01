
<script>
import { logout } from 'service/auth';

export default {
  name: 'Logout',
  created() {
    console.log("LOGGING OUT")
    logout()
    this.$router.push({ name: 'login' })
  },
  render() {
    return ''
  }
}
</script>