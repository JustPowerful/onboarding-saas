<script setup lang="ts">
import { Loader2 as LoaderSpinner } from 'lucide-vue-next'

import type { Workspace } from '@/types/workspaces'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'

// import t
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

import { EllipsisIcon, Trash, Edit } from 'lucide-vue-next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { ref } from 'vue'
import Button from './ui/button/Button.vue'
import api from '@/services/api'

const props = defineProps<{
  workspace: Workspace
  fetchWorkspaces: () => Promise<void>
}>()

const editOpen = ref(false)
const deleteOpen = ref(false)
const loading = ref(false)
const title = ref(props.workspace.title)

async function saveChanges() {
  try {
    loading.value = true
    const { data } = await api.patch(`/workspace/update/${props.workspace.id}`, {
      title: title.value
    })
    editOpen.value = false
    props.fetchWorkspaces()
  } catch (error) {
    throw error
  } finally {
    loading.value = false
  }
}

async function deleteWorkspace() {
  try {
    loading.value = true
    await api.delete(`/workspace/delete/${props.workspace.id}`)
    deleteOpen.value = false
    props.fetchWorkspaces()
  } catch (error) {
    throw error
  } finally {
    loading.value = false
  }
}
</script>
<template>
  <Dialog v-model:open="deleteOpen">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ t('delete_workspace') }}</DialogTitle>
        <DialogDescription>
          {{ t('delete_workspace_description') }}
        </DialogDescription>
      </DialogHeader>
      <!-- <Button @click="saveChanges">Save Changes</Button> -->
      <div class="flex gap-1 justify-end">
        <Button @click="deleteWorkspace" :disabled="loading">
          <LoaderSpinner v-if="loading" class="mr-2 size-4 animate-spin" />
          <span>{{ t('sure') }}</span>
        </Button>
        <Button @click="deleteOpen = !deleteOpen" class="bg-zinc-800 hover:bg-zinc-700">
          <span>{{ t('cancel') }}</span>
        </Button>
      </div>
    </DialogContent>
  </Dialog>
  <!-- Edit dialog -->
  <Dialog v-model:open="editOpen">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ t('edit_workspace') }}</DialogTitle>
        <DialogDescription>
          {{ t('edit_workspace_description') }}
        </DialogDescription>
      </DialogHeader>
      <Input :placeholder="t('workspace_placeholder')" v-model:model-value="title" />
      <!-- <Button @click="saveChanges">Save Changes</Button> -->
      <Button @click="saveChanges" :disabled="loading">
        <LoaderSpinner v-if="loading" class="mr-2 size-4 animate-spin" />
        <span>{{ t('save_changes') }}</span>
      </Button>
    </DialogContent>
  </Dialog>

  <RouterLink :to="`/workspace/${workspace.id}`">
    <div class="relative border-2 border-zinc-200 bg-white rounded-md p-4">
      <h2 class="text-lg font-semibold">{{ workspace.title }}</h2>
      <div class="text-sm text-zinc-500">
        {{ workspace.clients.length }} Client<span v-if="workspace.clients.length > 1">s</span>
      </div>
      <div class="absolute top-2 right-2">
        <DropdownMenu>
          <DropdownMenuTrigger class="text-zinc-500">
            <EllipsisIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Workspace menu</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem class="flex items-center gap-1" @click="editOpen = !editOpen"
              ><Edit :size="12" /> Edit</DropdownMenuItem
            >
            <DropdownMenuItem class="flex items-center gap-1" @click="deleteOpen = !deleteOpen"
              ><Trash :size="12" /> Delete</DropdownMenuItem
            >
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  </RouterLink>
</template>
