import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { storeToRefs } from 'pinia'

import { hasAccessToken } from '@/services/fundermaps/session'
import { useSessionStore } from '@/stores/session'
import { loginRedirect } from '@/services/oidc'

import Login from '@/views/auth/Login.vue'
import Callback from '@/views/auth/Callback.vue'
import Logout from '@/views/auth/Logout.vue'
import NotFound from '@/views/auth/NotFound.vue'
import Home from '@/views/HomeView.vue'

/**
 * Everything past the Werkbank is split per route.
 *
 * The Werkbank is the landing page and is eagerly imported; the rest arrives
 * when someone actually goes there. The two that matter most are the wizard's
 * step 2 screens — they pull in maplibre-gl (~250 KB gzipped) for the pand map,
 * and the majority of sessions never open one.
 */
const InquiryList = () => import('@/views/InquiryListView.vue')
const InquiryView = () => import('@/views/inquiry/InquiryView.vue')
const InquiryStep1 = () => import('@/views/inquiry/InquiryStep1.vue')
const InquiryStep2 = () => import('@/views/inquiry/InquiryStep2.vue')
const InquiryStep3 = () => import('@/views/inquiry/InquiryStep3.vue')

const RecoveryList = () => import('@/views/RecoveryListView.vue')
const RecoveryView = () => import('@/views/recovery/RecoveryView.vue')
const RecoveryStep1 = () => import('@/views/recovery/RecoveryStep1.vue')
const RecoveryStep2 = () => import('@/views/recovery/RecoveryStep2.vue')
const RecoveryStep3 = () => import('@/views/recovery/RecoveryStep3.vue')

const routes: RouteRecordRaw[] = [
  // Login lives in the auth app. Redirect to OIDC in beforeEnter — before the
  // component renders — so no local login page flashes during the hand-off.
  // Reached via logout (push to 'login') and direct /login hits; the global
  // guard handles protected routes the same way.
  {
    name: 'login',
    path: '/login',
    component: Login,
    meta: { public: true },
    beforeEnter: async () => {
      await loginRedirect()
      return false
    },
  },
  {
    name: 'auth-callback',
    path: '/auth/callback',
    component: Callback,
    meta: { public: true },
  },
  { name: 'logout', path: '/logout', component: Logout },

  // The landing page is your bench, not the archive — see views/HomeView.vue.
  { name: 'home', path: '/', component: Home },

  /*
   * The explorer's whole question — filters, sort and page — lives in the query
   * string (see services/explorer.ts), which is what makes a view shareable.
   * The old `/:page?` path segment is gone with it: two places to express a
   * page number is one too many, and the path version could not carry a filter.
   */
  { name: 'inquiry-list', path: '/inquiries', component: InquiryList },
  { name: 'inquiry-new', path: '/inquiry/create', component: InquiryStep1 },
  { name: 'inquiry-edit-1', path: '/inquiry/:id/edit/1', component: InquiryStep1 },
  { name: 'inquiry-edit-2', path: '/inquiry/:id/edit/2', component: InquiryStep2 },
  { name: 'inquiry-edit-3', path: '/inquiry/:id/edit/3', component: InquiryStep3 },
  { name: 'inquiry-view', path: '/inquiry/:id', component: InquiryView },

  { name: 'recovery-list', path: '/recoveries', component: RecoveryList },
  { name: 'recovery-new', path: '/recovery/create', component: RecoveryStep1 },
  { name: 'recovery-edit-1', path: '/recovery/:id/edit/1', component: RecoveryStep1 },
  { name: 'recovery-edit-2', path: '/recovery/:id/edit/2', component: RecoveryStep2 },
  { name: 'recovery-edit-3', path: '/recovery/:id/edit/3', component: RecoveryStep3 },
  { name: 'recovery-view', path: '/recovery/:id', component: RecoveryView },

  {
    name: 'not-found',
    path: '/:pathMatch(.*)*',
    component: NotFound,
    meta: { public: true },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  /**
   * A new screen starts at the top; going back returns you to where you were.
   * The explorer is the reason this matters: paging through it pushes a new
   * URL each time, and without this you would land mid-table on every page.
   */
  scrollBehavior(to, from, saved) {
    return saved ?? { top: 0 }
  },
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
    // Hand off to the auth app here, before any route component renders, so the
    // user never sees a local login page flash.
    await loginRedirect()
    return false
  }
})

export default router
