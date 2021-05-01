import Vue from 'vue'
import VueRouter, { Route } from 'vue-router'

// Dashboard
import Dashboard from '@/views/Dashboard.vue'

// Auth & User
import Login from '@/views/Login.vue'
import Logout from '@/views/Logout.vue'
import User from '@/views/User.vue'
import Security from '@/views/Security.vue'

// Register
import Register from '@/views/RegisterOrganization.vue'

// Single Report
import Step1 from '@/views/report/Step1.vue'
import Step2 from '@/views/report/Step2.vue'
import Step3 from '@/views/report/Step3.vue'
import ReportView from '@/views/report/View.vue'

// Reports
import Reports from '@/views/Reports.vue'

// Organization
import Organization from '@/views/Organization.vue'

// Admin
import AdminDashboard from '@/views/admin/AdminDashboard.vue'
import AdminOrganization from '@/views/admin/AdminOrganization.vue'
import AdminOrganizations from '@/views/admin/AdminOrganizations.vue'
import AdminOrganizationProposals from '@/views/admin/AdminOrganizationProposals.vue'

// 404
import NotFound from '@/views/NotFound.vue'

// Maps
import MapView from '@/views/Map.vue'
import Map2View from '@/views/Map2.vue'

// Services
import { isLoggedIn, isAdmin, logout } from '../services/auth'

Vue.use(VueRouter)

const routes = [
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
    component: Logout,
    meta: {
      layout: 'empty',
      profile: true
    }
  },
  {
    path: '/user',
    name: 'user',
    component: User
  },
  {
    path: '/security',
    name: 'security',
    component: Security
  },
  // Registration
  {
    path: '/register/:id',
    name: 'register',
    component: Register,
    meta: {
      layout: 'login',
      public: true
    }
  },

  // Maps
  {
    path: '/map',
    name: 'map',
    component: MapView,
    meta: {
      map: true,
    }
  },
  {
    path: '/map/cknycxq5h1f9a17pj578xieqj',
    name: 'map2',
    component: Map2View,
    meta: {
      layout: 'map',
      map: true,
      public: true
    }
  },

  // SuperUser
  {
    path: '/organization',
    name: 'organization',
    component: Organization
  },

  // Inquiry
  {
    path: '/inquiry/create/',
    name: 'new-report', // TODO No idea why, but new-report didn't work
    component: Step1
  },
  {
    path: '/inquiry/:id/edit/1',
    name: 'edit-report-1',
    component: Step1
  },
  {
    path: '/inquiry/:id/edit/2',
    name: 'edit-report-2',
    component: Step2
  },
  {
    path: '/inquiry/:id/edit/3',
    name: 'edit-report-3',
    component: Step3
  },
  {
    path: '/inquiry/:id/',
    name: 'view-report',
    component: ReportView
  },
  // Reports
  {
    path: '/inquiries/:page?',
    name: 'reports',
    component: Reports
  },

  // Admin
  {
    path: '/admin/',
    name: 'admin-dashboard',
    component: AdminDashboard,
    meta: {
      layout: 'empty',
      admin: true
    }
  },
  {
    path: '/admin/organisaties',
    name: 'admin-organizations',
    component: AdminOrganizations,
    meta: {
      layout: 'admin',
      admin: true
    }
  },
  {
    path: '/admin/organisatie/:id',
    name: 'admin-organization',
    component: AdminOrganization,
    meta: {
      layout: 'admin',
      admin: true
    }
  },
  {
    path: '/admin/aanmeldingen/',
    name: 'admin-organization-proposals',
    component: AdminOrganizationProposals,
    meta: {
      layout: 'admin',
      admin: true
    }
  },
  {
    path: '/admin/user',
    name: 'admin-user',
    component: User,
    meta: {
      layout: 'admin',
      profile: true
    }
  },
  {
    path: '/admin/security',
    name: 'admin-security',
    component: Security,
    meta: {
      layout: 'admin',
      profile: true
    }
  },

  // 404
  {
    path: '/not-found',
    name: 'not-found',
    component: NotFound,
    meta: {
      layout: 'login',
      public: true
    }
  },
  {
    path: '/*',
    name: '404',
    component: NotFound,
    meta: {
      layout: 'login',
      public: true
    }
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

router.beforeEach((to: Route, from: Route, next: any) => {
  // Public pages
  if (to.meta && to.meta.public) {
    next()
  } else if (isLoggedIn()) {
    // Admin pages are only visible to admins
    // Anyone else will get a 404
    if (to.meta && to.meta.admin) {
      if (isAdmin()) {
        next()
      } else {
        next({ name: '404' })
      }
      // Regular dashboard pages are not available to admins
    } else {
      if (isAdmin() && (!to.meta || !to.meta.profile)) {
        next({ name: 'admin-dashboard' })
      } else {
        next()
      }
    }
  } else {
    // If the user is logged in, log out first
    if (isLoggedIn()) {
      logout()
    }
    next({ name: 'login' })
  }
})

export default router;
