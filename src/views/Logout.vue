
<script>
import { logout } from 'service/auth';

import { mapActions } from 'vuex'

export default {
  name: 'Logout',
  created() {
    // console.log("LOGGING OUT")
    
    // Clean up Vuex
    this.clearUser()
    this.clearOrg()
    this.clearSamples()
    this.createReport()
    this.clearUsers()

    logout()
    this.$router.push({ name: 'login' })
  },
  methods: {
    ...mapActions('user', [
      'clearUser'
    ]),
    ...mapActions('org', [
      'clearOrg'
    ]),
    ...mapActions('orgUsers', [
      'clearUsers'
    ]),
    ...mapActions('samples', [
      'clearSamples'
    ]),
    ...mapActions('report', [
      'clearReport'
    ])
  },
  render() {
    return ''
  }
}
</script>