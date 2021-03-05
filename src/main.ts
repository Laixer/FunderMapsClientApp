import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import BootstrapVue from 'bootstrap-vue'
import VueTypeaheadBootstrap from 'vue-typeahead-bootstrap'

// Services
import { refreshLogin } from './services/auth'

// Named Avatar Generator
import { config as configNamedAvatars } from './utils/namedavatar'

// Bootstrap config
import "@/assets/sass/bootstrap.scss";

configNamedAvatars()

// Bootstrap Vue
Vue.use(BootstrapVue)

Vue.component('vue-typeahead-bootstrap', VueTypeaheadBootstrap)

Vue.config.productionTip = false

new Vue({
  router,
  store,
  created() {
    setInterval(() => {
      refreshLogin()
    }, 60000 * 10)
  },
  render: createElement => createElement(App)
}).$mount('#app')
