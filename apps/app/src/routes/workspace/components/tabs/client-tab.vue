<script setup lang="ts">
import Button from '@/components/ui/button/Button.vue'
import type { Client, Workspace } from '@/types/workspaces'
import { Plus, Loader2 as LoaderSpinner } from 'lucide-vue-next'
import { onMounted, reactive } from 'vue'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import Input from '@/components/ui/input/Input.vue'
import Label from '@/components/ui/label/Label.vue'
import api from '@/services/api'
import ClientListItem from '../ClientListItem.vue'

const props = defineProps<{
  workspace: Workspace
}>()

const createState = reactive({
  isDialogOpen: false,
  loading: false,
  nameInput: '',
  emailInput: '',
  phoneInput: '',
  error: null as null | string
})

async function createClient() {
  try {
    createState.loading = true
    await api.post(`/client/create`, {
      workspace_id: props.workspace.id,
      name: createState.nameInput,
      email: createState.emailInput,
      phone: createState.phoneInput
    })
    await getClients()
    createState.isDialogOpen = false
  } catch (error: any) {
    createState.error = error.message
  } finally {
    createState.loading = false
  }
}

const clientsState = reactive({
  data: [] as Client[],
  loading: false,
  error: null as null | string
})
async function getClients() {
  try {
    clientsState.loading = true
    const { data } = await api.get(`/client/getall/${props.workspace.id}`)
    clientsState.data = data.clients
  } catch (error: any) {
    clientsState.error = error.message
  } finally {
    clientsState.loading = false
  }
}

onMounted(() => {
  getClients()
})
</script>
<template>
  <div class="p-4">
    <Dialog v-model:open="createState.isDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add client</DialogTitle>
        </DialogHeader>
        <Label>Client name</Label>
        <Input placeholder="name" v-model="createState.nameInput" />
        <Label>Client email</Label>
        <Input placeholder="email" v-model="createState.emailInput" />
        <Label>Client phone</Label>
        <Input placeholder="phone" v-model="createState.phoneInput" />

        <div class="flex justify-between">
          <Button class="bg-zinc-800 hover:bg-zinc-700" @click="createState.isDialogOpen = false"
            >Cancel</Button
          >
          <Button @click="createClient" class="flex items-center gap-1">
            <LoaderSpinner v-if="createState.loading" :size="16" class="text-white animate-spin" />
            Add</Button
          >
        </div>
      </DialogContent>
    </Dialog>
    <div class="flex items-center justify-between">
      <div class="">
        <h1 class="text-2xl font-semibold text-zinc-800">Client list</h1>
        <p class="text-lg text-zinc-600 font-normal">
          Navigate through your client list to see details
        </p>
      </div>
      <Button class="flex items-center gap-1" @click="createState.isDialogOpen = true">
        New client <Plus :size="16" />
      </Button>
    </div>
    <!-- List of the client -->
    <div>
      <div class="grid grid-cols-2 text-sm text-zinc-600 border-b-2 border-zinc-300 p-1">
        <div>Client</div>
        <div>Current state</div>
      </div>
      <ClientListItem
        v-if="clientsState.data.length > 0"
        v-for="client in clientsState.data"
        :client="client"
        :reload-clients="getClients"
      />
    </div>
  </div>
</template>
