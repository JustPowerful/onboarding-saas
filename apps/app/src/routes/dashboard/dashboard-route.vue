<script setup lang="ts">
import Button from '@/components/ui/button/Button.vue'
import WorkspaceCard from '@/components/workspace-card.vue'
import api from '@/services/api'
import { useUserStore } from '@/stores/user'
import type { Workspace } from '@/types/workspaces'
import { Plus, Loader2 as LoaderSpinner } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import Input from '@/components/ui/input/Input.vue'

const { currentUser } = storeToRefs(useUserStore())
const workspaces = ref<Workspace[]>([])
const createState = reactive({
  title: '',
  toggle: false,
  loading: false
})

async function fetchWorkspaces() {
  try {
    const { data } = await api.get(`/workspace/getall`)
    workspaces.value = data.workspaces
  } catch (error) {
    throw error
  }
}

async function createWorkspace() {
  try {
    createState.loading = true
    await api.post(`/workspace/create`, {
      title: createState.title
    })
    createState.toggle = false
    await fetchWorkspaces()
  } catch (error) {
    throw error
  } finally {
    createState.loading = false
  }
}

onMounted(() => {
  fetchWorkspaces()
})
</script>
<template>
  <Dialog v-model:open="createState.toggle">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ t('create_workspace') }}</DialogTitle>
        <DialogDescription>
          {{ t('create_workspace_description') }}
        </DialogDescription>
      </DialogHeader>
      <Input :placeholder="t('workspace_placeholder')" v-model="createState.title" />
      <!-- <Button @click="saveChanges">Save Changes</Button> -->
      <div class="flex gap-1 justify-end">
        <Button @click="createWorkspace" :disabled="createState.loading">
          <LoaderSpinner v-if="createState.loading" class="mr-2 size-4 animate-spin" />
          <span>{{ t('save') }}</span>
        </Button>
        <Button
          @click="createState.toggle = !createState.toggle"
          class="bg-zinc-800 hover:bg-zinc-700"
        >
          <span>{{ t('cancel') }}</span>
        </Button>
      </div>
    </DialogContent>
  </Dialog>
  <private-view>
    <div class="container">
      <div class="px-4 py-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-semibold">
              Welcome {{ currentUser?.firstname }}, consult your workspaces
            </h1>
            <p class="text-sm text-zinc-500 mb-6">
              Start with choosing the table you are working on
            </p>
          </div>
          <div>
            <Button class="flex gap-2 items-center" @click="createState.toggle = true">
              New workspace <Plus :size="18" />
            </Button>
          </div>
        </div>
        <div class="grid grid-cols-3 gap-4">
          <workspace-card
            :fetch-workspaces="fetchWorkspaces"
            v-for="workspace in workspaces"
            :key="workspace.id"
            :workspace="workspace"
          />
        </div>
      </div>
    </div>
  </private-view>
</template>
