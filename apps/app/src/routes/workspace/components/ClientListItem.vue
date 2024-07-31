<script setup lang="ts">
import api from '@/services/api'
import type { Client } from '@/types/workspaces'
import formatDateString from '@/utils/formate-date-string'
import { Ellipsis } from 'lucide-vue-next'
import { reactive } from 'vue'

const props = defineProps<{
  client: Client
  reloadClients: () => Promise<void>
}>()

const deleteState = reactive({
  loading: false,
  isDialogOpen: false,
  error: null as null | string
})

async function deleteClient() {
  try {
    deleteState.loading = true
    await api.delete(`/client/delete/${props.client.id}`)
    await props.reloadClients()
    deleteState.isDialogOpen = false
  } catch (error: any) {
    deleteState.error = error.message
  } finally {
    deleteState.loading = false
  }
}
</script>
<template>
  <div class="grid grid-cols-2 border-b-2 border-zinc-300 p-2">
    <!-- col 1 -->
    <div>
      <div class="text-xl font-semibold">{{ client.name }}</div>
      <div class="text-base mb-2">Edited {{ formatDateString(client.updated_at) }}</div>
      <div class="text-base text-zinc-600 mb-1">
        Created {{ formatDateString(client.create_at) }}
      </div>
    </div>
    <!-- col 2 -->
    <div class="flex justify-between items-center">
      <div v-if="client.assignments.length > 0">{{ client.assignments[0].pipline.title }}</div>
      <div v-else></div>
      <button>
        <Ellipsis :size="16" />
      </button>
    </div>
  </div>
</template>
