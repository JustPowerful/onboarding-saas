<script setup lang="ts">
import api from '@/services/api'
import type { Client } from '@/types/workspaces'
import formatDateString from '@/utils/formate-date-string'
import { Edit, Ellipsis, Loader2, TrashIcon } from 'lucide-vue-next'
import { reactive } from 'vue'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

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
import Input from '@/components/ui/input/Input.vue'
import Label from '@/components/ui/label/Label.vue'

const props = defineProps<{
  client: Client
  reloadClients: () => Promise<void>
}>()

const deleteState = reactive({
  loading: false,
  isDialogOpen: false,
  error: null as null | string
})

const editState = reactive({
  loading: false,
  isDialogOpen: false,
  error: null as null | string,
  data: {
    name: props.client.name,
    email: props.client.email,
    phone: props.client.phone
  }
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

async function updateClient() {
  try {
    editState.loading = true
    await api.patch(`/client/update/${props.client.id}`, editState.data)
    await props.reloadClients()
    editState.isDialogOpen = false
  } catch (error: any) {
    editState.error = error.message
  } finally {
    editState.loading = false
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

    <Dialog v-model:open="editState.isDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit client information</DialogTitle>
        </DialogHeader>
        <Label>Name</Label>
        <Input v-model="editState.data.name" label="Name" placeholder="Name" class="mb-2" />
        <Label>Email</Label>
        <Input v-model="editState.data.email" label="Email" placeholder="Email" class="mb-2" />
        <Label>Phone</Label>
        <Input v-model="editState.data.phone" label="Phone" placeholder="Phone" class="mb-2" />

        <DialogFooter>
          <Button class="bg-zinc-800 hover:bg-zinc-700" @click="editState.isDialogOpen = false"
            >Cancel</Button
          >
          <Button @click="updateClient" class="flex items-center gap-1"
            ><Loader2 v-if="editState.loading" :size="16" class="animate-spin text-white" />
            Save</Button
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
      <!-- <button @click="deleteState.isDialogOpen = true">
        <Ellipsis :size="16" />
      </button> -->

      <DropdownMenu>
        <DropdownMenuTrigger
          ><button>
            <Ellipsis :size="16" /></button
        ></DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Client</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem @click="editState.isDialogOpen = true" class="flex items-center gap-1">
            <Edit :size="16" />
            Edit</DropdownMenuItem
          >
          <DropdownMenuItem
            @click="deleteState.isDialogOpen = true"
            class="flex items-center gap-1"
          >
            <TrashIcon :size="16" />
            Delete</DropdownMenuItem
          >
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
</template>
