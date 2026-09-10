import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { storeToRefs } from 'pinia'

import { useSessionStore } from '@/stores/session'
import { loginRedirect } from '@/services/auth'

import Login from '@/views/auth/Login.vue'
import Logout from '@/views/auth/Logout.vue'
import NotFound from '@/views/auth/NotFound.vue'
import NoAccess from '@/views/auth/NoAccess.vue'
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
const InquiryDetailsEdit = () => import('@/views/inquiry/InquiryDetailsEdit.vue')
const InquirySamplesEdit = () => import('@/views/inquiry/InquirySamplesEdit.vue')
const InquiryNew = () => import('@/views/inquiry/InquiryNewView.vue')

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
    beforeEnter: () => {
      loginRedirect(window.location.origin + '/')
      return false
    },
  },
  { name: 'logout', path: '/logout', component: Logout },
  // Shown to signed-in users who are not FunderMaps staff. Public so the guard
  // can land here without looping; the view itself decides what to show.
  { name: 'no-access', path: '/no-access', component: NoAccess, meta: { public: true } },

  // The landing page is your bench, not the archive — see views/HomeView.vue.
  { name: 'home', path: '/', component: Home },

  /*
   * The explorer's whole question — filters, sort and page — lives in the query
   * string (see services/explorer.ts), which is what makes a view shareable.
   * The old `/:page?` path segment is gone with it: two places to express a
   * page number is one too many, and the path version could not carry a filter.
   */
  { name: 'inquiry-list', path: '/inquiries', component: InquiryList },
  // The front door for a document is the review lane (2026-09-07): upload,
  // the pipeline reads, a person judges. The two edit pages remain for the
  // inquiry that comes out of it; the old wizard URLs redirect so nothing
  // bookmarked breaks.
  { name: 'inquiry-new', path: '/inquiry/create', component: InquiryNew },
  { name: 'inquiry-edit-details', path: '/inquiry/:id/details', component: InquiryDetailsEdit },
  { name: 'inquiry-edit-samples', path: '/inquiry/:id/samples', component: InquirySamplesEdit },
  { path: '/inquiry/:id/edit/1', redirect: (to) => ({ name: 'inquiry-edit-details', params: to.params }) },
  { path: '/inquiry/:id/edit/2', redirect: (to) => ({ name: 'inquiry-edit-samples', params: to.params }) },
  { path: '/inquiry/:id/edit/3', redirect: (to) => ({ name: 'inquiry-view', params: to.params }) },
  { name: 'inquiry-view', path: '/inquiry/:id', component: InquiryView },

  { name: 'recovery-list', path: '/recoveries', component: RecoveryList },

  // The review lane. Everything here was read by the pipeline and is waiting
  // for a person; nothing reaches report.* until a reviewer commits it.
  {
    name: 'review-queue',
    path: '/review',
    component: () => import('@/views/review/ReviewQueueView.vue'),
  },
  {
    name: 'review-dossier',
    path: '/review/:id',
    component: () => import('@/views/review/ReviewDossierView.vue'),
  },
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
  const { isAuthenticated, isStaff } = storeToRefs(sessionStore)

  if (to.meta.public) return true

  // Restore the user from the session cookie on first load.
  if (!isAuthenticated.value) {
    try {
      await sessionStore.authenticate()
    } catch {
      // no session — handled below
    }
  }

  if (!isAuthenticated.value) {
    // Hand off to the auth app before any route component renders; it brings
    // the user back to the page they asked for.
    loginRedirect(window.location.origin + to.fullPath)
    return false
  }

  // The Studio is the internal invoer tool. Any account can sign in at the
  // auth app (the session is shared with Maps), but only platform members
  // get past this point; the API refuses the review lane to everyone else.
  if (!isStaff.value) {
    return { name: 'no-access' }
  }
})

export default router
