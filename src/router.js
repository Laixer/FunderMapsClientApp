import Vue from 'vue'
import Router from 'vue-router'

// Dashboard
import Dashboard from '@/views/Dashboard.vue'

// Auth & User
import Login from '@/views/Login.vue'
import Logout from '@/views/Logout.vue'
import User from '@/views/User.vue'

// Single Report
import ReportCreate from '@/views/report/Create'
import ReportEdit from '@/views/report/Edit'
import ReportView from '@/views/report/View'

// Reports 
import Reports from '@/views/Reports.vue'

// 404
import NotFound from '@/views/NotFound.vue'

// Services
import { isLoggedIn } from '@/services/auth'

Vue.use(Router)

let router = new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: Dashboard
    },

    // Authentication & User
    {
      path: '/login',
      name: 'login',
      component: Login,
      meta: {
        layout: 'login',
        public: true
      }
    },
    {
      path: '/logout',
      name: 'logout',
      component: Logout
    },
    {
      path: '/user',
      name: 'user',
      component: User
    },
    // Report
    {
      path: '/report/create/:document_name',
      name: 'new-report',
      component: ReportCreate
    },
    {
      path: '/report/:id/:document/edit/',
      name: 'edit-report',
      component: ReportEdit
    },
    {
      path: '/report/:id/:document',
      name: 'view-report',
      component: ReportView
    },
    // Reports
    {
      path: '/reports/:page?',
      name: 'reports',
      component: Reports
    },

    // 404
    {
      path: '/not-found',
      name: 'not-found',
      component: NotFound
    },
    {
      path: '/*',
      name: '404',
      component: NotFound
    }
  ]
})

router.beforeEach((to, from, next) => {
  if (isLoggedIn() || (! isLoggedIn() && to.meta && to.meta.public)) {
    next()
  } else {
    next({ name: 'login' })
  }
})

export default router;
