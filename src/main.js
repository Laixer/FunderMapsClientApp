import Vue from 'vue'
import App from '@/App.vue'
import router from '@/router'
import store from '@/store'

Vue.config.productionTip = false

// Services
import { refreshLogin } from '@/services/auth'
import { getVersion } from '@/services/version'

// Fonts (Gibson)
import "@/assets/sass/fonts.scss";

// Bootstrap config
import "@/assets/sass/bootstrap.scss";

// Bootstrap
import BootstrapVue from 'bootstrap-vue'
Vue.use(BootstrapVue)

// V-calender
import VCalender from 'v-calendar'
Vue.use(VCalender)

new Vue({
  router,
  store,
  data() {
    return {
      timer: null,
      version: 0
    }
  },
  created () {
    this.timer = setInterval(() => {
      refreshLogin()
    }, 60000 * 10)
  },
  mounted () {
    this.version = getVersion()
  },
  render: h => h(App)
}).$mount('#app')
