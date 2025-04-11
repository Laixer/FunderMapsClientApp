import Vue from "vue";
import VueRouter, { Route } from "vue-router";

// Dashboard
import Dashboard from "@/views/Dashboard.vue";

// Auth & User
import Login from "@/views/Login.vue";
import Logout from "@/views/Logout.vue";
// import User from "@/views/User.vue";

// Single Report
import Step1 from "@/views/report/Step1.vue";
import Step2 from "@/views/report/Step2.vue";
import Step3 from "@/views/report/Step3.vue";
import ReportView from "@/views/report/View.vue";

// Reports
import Reports from "@/views/Reports.vue";

// 404
import NotFound from "@/views/NotFound.vue";

// Services
import { isLoggedIn, isAdmin, logout } from "../services/auth";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "dashboard",
    component: Dashboard,
  },

  // Authentication & User
  {
    path: "/login",
    name: "login",
    component: Login,
    meta: {
      layout: "login",
      public: true,
    },
  },
  {
    path: "/logout",
    name: "logout",
    component: Logout,
    meta: {
      layout: "empty",
      profile: true,
    },
  },
  // {
  //   path: "/user",
  //   name: "user",
  //   component: User,
  // },

  // Inquiry
  {
    path: "/inquiry/create/",
    name: "new-report", // TODO No idea why, but new-report didn't work
    component: Step1,
    meta: {
      fullscreen: true,
    },
  },
  {
    path: "/inquiry/:id/edit/1",
    name: "edit-report-1",
    component: Step1,
    meta: {
      fullscreen: true,
    },
  },
  {
    path: "/inquiry/:id/edit/2/:page?/:step?",
    name: "edit-report-2",
    component: Step2,
    meta: {
      fullscreen: true,
    },
  },
  {
    path: "/inquiry/:id/edit/3/:page?",
    name: "edit-report-3",
    component: Step3,
    meta: {
      fullscreen: true,
    },
  },
  {
    path: "/inquiry/:id/:page?",
    name: "view-report",
    component: ReportView,
  },
  // Reports
  {
    path: "/inquiries/:page?",
    name: "reports",
    component: Reports,
  },

  // 404
  {
    path: "/not-found",
    name: "not-found",
    component: NotFound,
    meta: {
      layout: "login",
      public: true,
    },
  },
  {
    path: "/*",
    name: "404",
    component: NotFound,
    meta: {
      layout: "login",
      public: true,
    },
  },
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});

router.beforeEach((to: Route, from: Route, next: any) => {
  // Public pages
  if (to.meta && to.meta.public) {
    next();
  } else if (isLoggedIn()) {
    // Admin pages are only visible to admins
    // Anyone else will get a 404
    if (to.meta && to.meta.admin) {
      if (isAdmin()) {
        next();
      } else {
        next({ name: "404" });
      }
      // Regular dashboard pages are not available to admins
    } else {
      if (isAdmin() && (!to.meta || !to.meta.profile)) {
        next({ name: "admin-dashboard" });
      } else {
        next();
      }
    }
  } else {
    // If the user is logged in, log out first
    if (isLoggedIn()) {
      logout();
    }
    next({ name: "login" });
  }
});

export default router;
