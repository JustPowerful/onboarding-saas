<script setup lang="ts">
import type { Checklist, Client } from '@/types/workspaces'
import {
  Edit,
  Ellipsis,
  Plus,
  Search,
  Trash,
  Unlock,
  X,
  Loader2 as LoaderSpinner
} from 'lucide-vue-next'
import draggable from 'vuedraggable'
import Button from '@/components/ui/button/Button.vue'
import api from '@/services/api'
import { reactive, watch } from 'vue'
import ClientComponent from './Client.vue'
import Input from '@/components/ui/input/Input.vue'

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
  DialogTitle
} from '@/components/ui/dialog'

import formatDateString from '@/utils/formate-date-string'

const props = defineProps<{
  checklist: Checklist
  reloadChecklists: () => Promise<void>
  saveOrder: () => Promise<void>
}>()

async function createClientAssignment(client: Client) {
  try {
    await api.post('/pipeline/clientassignment/create', {
      pipeline_id: props.checklist.id,
      client_id: client.id
    })
    await props.reloadChecklists()
    await getUnassignedClients()
  } catch (error) {}
}

const editState = reactive<{
  toggleOpen: boolean
  title: string
  loading: boolean
}>({
  toggleOpen: false,
  title: props.checklist.title,
  loading: false
})

const deleteState = reactive<{
  toggleOpen: boolean
  loading: boolean
}>({
  toggleOpen: false,
  loading: false
})

async function updateChecklist() {
  try {
    editState.loading = true
    const { data } = await api.patch(`/pipeline/update/${props.checklist.id}`, {
      title: editState.title
    })
    props.reloadChecklists()
  } catch (error) {
    throw error
  } finally {
    editState.loading = false
    editState.toggleOpen = false
  }
}

async function deleteChecklist() {
  try {
    deleteState.loading = true
    await api.delete(`/pipeline/delete/${props.checklist.id}`)
    await props.reloadChecklists()
  } catch (error) {
    throw error
  } finally {
    deleteState.loading = false
    deleteState.toggleOpen = false
  }
}

const clientManagerState = reactive<{
  toggleOpen: boolean
  clients: Client[]
  search?: string
  loading: boolean
  error: string | null
}>({
  toggleOpen: false,
  clients: [],
  loading: false,
  error: null,
  search: ''
})

async function getUnassignedClients() {
  try {
    clientManagerState.loading = true
    const { data } = await api.get(
      `/client/getunassigned/${props.checklist.workspace_id}?search=${clientManagerState.search}`,
      {}
    )
    clientManagerState.clients = data.clients
  } catch (error: any) {
    clientManagerState.error = error.message
  } finally {
    clientManagerState.loading = false
  }
}

// watch toggleOpen and call getUnassignedClients
watch(
  () => clientManagerState.toggleOpen,
  () => {
    if (clientManagerState.toggleOpen) {
      getUnassignedClients()
    }
  }
)
</script>
<template>
  <div>
    <Dialog v-model:open="editState.toggleOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit pipeline</DialogTitle>
          <DialogDescription>
            Make changes to the pipeline title and description. Hit save to apply changes.
          </DialogDescription>
        </DialogHeader>

        <Input placeholder="Pipeline title" v-model="editState.title" />

        <DialogFooter>
          <Button @click="updateChecklist">
            <LoaderSpinner v-if="editState.loading" :size="16" class="text-white animate-spin" />
            Save</Button
          >
          <Button @click="editState.toggleOpen = false" class="bg-zinc-800 hover:bg-zinc-700"
            >Cancel</Button
          >
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <Dialog v-model:open="deleteState.toggleOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete pipeline</DialogTitle>
          <DialogDescription>
            Delete this pipeline and all its associated tasks. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button @click="deleteChecklist">
            <LoaderSpinner :size="16" class="text-white animate-spin" v-if="deleteState.loading" />
            Sure</Button
          >
          <Button @click="deleteState.toggleOpen = false" class="bg-zinc-800 hover:bg-zinc-700"
            >Cancel</Button
          >
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <div
      class="relative bg-white border-2 min-w-[300px] max-w-[240px] min-h-[120px] h-fit p-2 border-zinc-200 rounded-md flex flex-col gap-3"
    >
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-1">
          <Unlock v-if="checklist.default" :size="16" class="text-zinc-500" />
          {{ props.checklist.title }}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger>
            <button class="text-zinc-500">
              <Ellipsis :size="16" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Pipeline settings</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem class="flex items-center gap-1" @click="editState.toggleOpen = true">
              <Edit :size="16" /> Edit pipeline</DropdownMenuItem
            >
            <DropdownMenuItem
              :disabled="checklist.default"
              @click="deleteState.toggleOpen = true"
              class="flex items-center gap-1"
            >
              <Trash :size="16" /> Delete piepline</DropdownMenuItem
            >
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <draggable
        v-model="props.checklist.client_assignments"
        :group="{ name: 'client_assignments' }"
        item-key="id"
        tag="div"
        class="rounded-md flex-grow flex flex-col gap-2"
        ghost-class="drag-task"
        @end="props.saveOrder"
      >
        <template #item="{ element: client_assignment }">
          <ClientComponent :data="client_assignment" />
        </template>
      </draggable>
      <div class="relative w-full">
        <Button
          v-if="checklist.default"
          @click="clientManagerState.toggleOpen = !clientManagerState.toggleOpen"
          class="flex items-center gap-2 w-full"
        >
          Assign Client <Plus :size="16" />
        </Button>
        <div
          v-if="clientManagerState.toggleOpen"
          class="flex flex-col items-start absolute w-full p-4 bg-white text-black rounded-md shadow-md top-[3rem]"
        >
          <button @click="clientManagerState.toggleOpen = false" class="absolute top-3 right-3">
            <X :size="16" />
          </button>
          <div class="text-md font-bold mb-2">Project clients</div>
          <div>
            <form @submit.prevent="getUnassignedClients" class="grid grid-cols-[9fr_1fr] gap-2">
              <Input v-model="clientManagerState.search" :placeholder="'Search clients'" />
              <Button type="submit">
                <Search :size="16" />
              </Button>
            </form>
          </div>
          <div
            class="w-full mt-2"
            v-if="clientManagerState.clients"
            v-for="client in clientManagerState.clients"
          >
            <button
              @click="
                () => {
                  createClientAssignment(client)
                }
              "
              class="flex flex-col gap-1 p-2 hover:bg-zinc-100 w-full border-t-2"
            >
              <div>{{ client.name }}</div>
              <div class="text-sm text-zinc-500">
                Edited {{ formatDateString(client.updated_at) }}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
