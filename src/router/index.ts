import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { storeToRefs } from 'pinia'

import { hasAccessToken } from '@/services/fundermaps/session'
import { useSessionStore } from '@/stores/session'

import Login from '@/views/auth/Login.vue'
import Logout from '@/views/auth/Logout.vue'
import NotFound from '@/views/auth/NotFound.vue'
import Dashboard from '@/views/Dashboard.vue'
import InquiryList from '@/views/InquiryListView.vue'
import InquiryStep1 from '@/views/inquiry/InquiryStep1.vue'
import InquiryStep2 from '@/views/inquiry/InquiryStep2.vue'
import InquiryStep3 from '@/views/inquiry/InquiryStep3.vue'
import InquiryView from '@/views/inquiry/InquiryView.vue'
import RecoveryList from '@/views/RecoveryListView.vue'
import RecoveryStep1 from '@/views/recovery/RecoveryStep1.vue'
import RecoveryStep2 from '@/views/recovery/RecoveryStep2.vue'
import RecoveryStep3 from '@/views/recovery/RecoveryStep3.vue'
import RecoveryView from '@/views/recovery/RecoveryView.vue'

const routes: RouteRecordRaw[] = [
  { name: 'login', path: '/login', component: Login, meta: { layout: 'login', public: true } },
  { name: 'logout', path: '/logout', component: Logout, meta: { layout: 'empty' } },

  { name: 'dashboard', path: '/', component: Dashboard },
  { name: 'inquiry-list', path: '/inquiries/:page?', component: InquiryList },

  { name: 'inquiry-new', path: '/inquiry/create', component: InquiryStep1, meta: { fullscreen: true } },
  { name: 'inquiry-edit-1', path: '/inquiry/:id/edit/1', component: InquiryStep1, meta: { fullscreen: true } },
  { name: 'inquiry-edit-2', path: '/inquiry/:id/edit/2/:page?/:step?', component: InquiryStep2, meta: { fullscreen: true } },
  { name: 'inquiry-edit-3', path: '/inquiry/:id/edit/3/:page?', component: InquiryStep3, meta: { fullscreen: true } },
  { name: 'inquiry-view', path: '/inquiry/:id/:page?', component: InquiryView },

  { name: 'recovery-list', path: '/recoveries/:page?', component: RecoveryList },

  { name: 'recovery-new', path: '/recovery/create', component: RecoveryStep1, meta: { fullscreen: true } },
  { name: 'recovery-edit-1', path: '/recovery/:id/edit/1', component: RecoveryStep1, meta: { fullscreen: true } },
  { name: 'recovery-edit-2', path: '/recovery/:id/edit/2/:page?/:step?', component: RecoveryStep2, meta: { fullscreen: true } },
  { name: 'recovery-edit-3', path: '/recovery/:id/edit/3/:page?', component: RecoveryStep3, meta: { fullscreen: true } },
  { name: 'recovery-view', path: '/recovery/:id/:page?', component: RecoveryView },

  { name: 'not-found', path: '/:pathMatch(.*)*', component: NotFound, meta: { layout: 'login', public: true } },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to) => {
  const sessionStore = useSessionStore()
  const { isAuthenticated } = storeToRefs(sessionStore)

  // Restore session on first load if a bearer is in localStorage but the
  // store has no current user yet.
  if (!isAuthenticated.value && hasAccessToken()) {
    try {
      await sessionStore.authenticateFromAccessToken()
    } catch {
      // session validation failed — store has cleared itself
    }
  }

  if (to.meta.public) return true

  if (!isAuthenticated.value) {
    return { name: 'login' }
  }
})

export default router
