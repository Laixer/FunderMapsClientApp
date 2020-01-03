import Vue from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import router from './router'
import store from './store'

Vue.config.productionTip = false

// Services
import { refreshLogin } from './services/auth'

// Fonts (Gibson)
import "@/assets/sass/fonts.scss";

// Bootstrap config
import "@/assets/sass/bootstrap.scss";

// Bootstrap
import BootstrapVue from 'bootstrap-vue'
Vue.use(BootstrapVue)

import VueBootstrapTypeahead from 'vue-bootstrap-typeahead'
Vue.component('vue-bootstrap-typeahead', VueBootstrapTypeahead)

// Named Avatar Generator
import { config as configNamedAvatars } from './utils/namedavatar'
configNamedAvatars()

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
