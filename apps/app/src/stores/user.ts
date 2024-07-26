import api from '@/services/api'
import type { ServerError } from '@/types/server'
import type { User } from '@/types/users'
import { defineStore } from 'pinia'

export const useUserStore = defineStore({
  id: 'user-store',
  state: () => ({
    currentUser: null as User | null,
    isLoading: false,
    error: null as ServerError | null
  }),
  getters: {
    isAdmin(): boolean {
      return true
    }
  },
  actions: {
    async hydrate() {
      this.isLoading = true
      try {
        const res = await api.get('/users/me')
        console.log(res.data)
        this.currentUser = res.data.user
      } catch (err: any) {
        this.error = err?.response?.data
      }
      this.isLoading = false
    },
    async dehydrate() {
      this.$reset()
    }
  }
})
