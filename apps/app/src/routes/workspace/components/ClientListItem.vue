<script setup lang="ts">
import api from '@/services/api'
import type { Client } from '@/types/workspaces'
import formatDateString from '@/utils/formate-date-string'
import { Ellipsis, Loader2 } from 'lucide-vue-next'
import { reactive } from 'vue'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import Button from '@/components/ui/button/Button.vue'

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
    <Dialog v-model:open="deleteState.isDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete client</DialogTitle>
          <DialogDescription>
            Delete client <strong>{{ client.name }}</strong
            >?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button class="bg-zinc-800 hover:bg-zinc-700" @click="deleteState.isDialogOpen = false"
            >Cancel</Button
          >
          <Button @click="deleteClient" class="flex items-center gap-1"
            ><Loader2 v-if="deleteState.loading" :size="16" class="animate-spin text-white" />
            Sure</Button
          >
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
      <button @click="deleteState.isDialogOpen = true">
        <Ellipsis :size="16" />
      </button>
    </div>
  </div>
</template>
