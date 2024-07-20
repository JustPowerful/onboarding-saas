import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { hydrate } from '@/hydrate'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'

import LoginRoute from '@/routes/login/login-route.vue'
import ForgotRoute from '@/routes/forgot/forgot-route.vue'
import ResetRoute from '@/routes/reset/reset-route.vue'
import PrivateNotFoundRoute from '@/routes/private-not-found-route.vue'
import { useUserStore } from '@/stores/user'
import RegisterRoute from './routes/register/register-route.vue'
const defaultRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    name: 'login',
    path: '/login',
    component: LoginRoute,
    meta: {
      public: true
    }
  },
  {
    name: 'register',
    path: '/register',
    component: RegisterRoute,
    meta: {
      public: true
    }
  },
  {
    name: 'reset',
    path: '/reset',
    component: ResetRoute,
    meta: {
      public: true
    }
  },
  {
    name: 'forgot',
    path: '/forgot',
    component: ForgotRoute,
    meta: {
      public: true
    }
  },
  {
    name: 'private-404',
    path: '/:_(.+)+',
    component: PrivateNotFoundRoute
  }
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: defaultRoutes
})

let firstLoad = true
router.beforeEach(async (to, from) => {
  const authStore = useAuthStore()
  const appStore = useAppStore()
  const userStore = useUserStore()
  // First load
  if (firstLoad) {
    firstLoad = false
    try {
      await authStore.authCheck()
      await appStore.hydrate()
    } catch (err: any) {
      appStore.error = err
    }
  }

  if (to.meta?.public !== true) {
    if (appStore.isHydrated === false) {
      appStore.isHydrating = false
      if (authStore.isAuthenticated) {
        try {
          await hydrate()
        } catch {
          // Ignore error
        }
        return to.fullPath
      } else {
        if (to.fullPath) {
          return '/login?redirect=' + encodeURIComponent(to.fullPath)
        } else {
          return '/login'
        }
      }
    }
  }
})
