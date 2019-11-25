<script>
import emptyLayout from './empty'
import defaultLayout from './default'
import adminLayout from './admin'
import loginLayout from './login'

/**
 * Determines which layout to use based on the route meta data
 */
export default {
  name: "Layouts",
  components: {
    emptyLayout, defaultLayout, adminLayout, loginLayout
  },
  render(h) {
    let layout = (this.$route.meta && this.$route.meta.layout) 
      ? this.$route.meta.layout
      : 'default';

    switch (layout) {
      case 'login':
        return h('loginLayout', this.$slots.default)
      case 'admin':
        return h('adminLayout', this.$slots.default)
      case 'empty':
        return h('emptyLayout', this.$slots.default)
      default:
        return h('defaultLayout', this.$slots.default)
    }
  }
}
</script>
