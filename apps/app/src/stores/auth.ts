import { defineStore } from 'pinia'
import api from '@/services/api'
import { router } from '@/router'
import { dehydrate, hydrate } from '@/hydrate'
import type { LoginBody, RegisterBody } from '@/types'
import type { ServerError } from '@/types/server'

let firstRefresh = true
let isRefreshing = false
export const useAuthStore = defineStore({
  id: 'auth-store',
  state: () => ({
    token: localStorage.getItem('access_token'),
    isAuthenticated: true,
    isLoading: false,
    error: null as ServerError | null,
    message: null as string | null
  }),
  getters: {},
  actions: {
    async hydrate() {},
    async dehydrate() {
      this.$reset()
    },
    async authCheck() {
      api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`

      if (!api.defaults.headers.common['Authorization']) return
      // Allow refresh during initial page load
      if (firstRefresh) firstRefresh = false

      if (isRefreshing) return

      this.isLoading = true
      this.error = null
      isRefreshing = true
      try {
        await api.get('/auth/authcheck')
        this.isAuthenticated = true
      } catch (err: any) {
        this.token = null
        this.isAuthenticated = false
      }
      this.isLoading = false
    },

    async login(data: LoginBody) {
      this.isLoading = true
      this.error = null
      try {
        const response = await api.post('/auth/login', data)

        localStorage.setItem('access_token', response.data.access_token)
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`
        this.token = response.data.access_token
        this.isAuthenticated = true
        await hydrate()
      } catch (err: any) {
        this.error = err?.response?.data
        this.token = null
        this.isAuthenticated = false
      }
      this.isLoading = false
    },
    async logout() {
      this.isLoading = true

      delete api.defaults.headers.common['Authorization']
      localStorage.removeItem('access_token')
      this.token = ''
      this.isAuthenticated = false

      await dehydrate()

      this.isLoading = false

      router.replace({ name: 'login' })
    }
  }
})
