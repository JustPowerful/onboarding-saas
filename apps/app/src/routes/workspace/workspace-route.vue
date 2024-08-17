<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import api from '@/services/api'

import { ChevronRight, Settings, Table2, User, UserRoundPlus } from 'lucide-vue-next'

import type { Member, Workspace } from '@/types/workspaces'
import NavButton from './components/NavButton.vue'
import BoardTab from './components/tabs/board-tab.vue'
import ClientTab from './components/tabs/client-tab.vue'
import SettingsTab from './components/tabs/settings-tab.vue'
import Button from '@/components/ui/button/Button.vue'
import type { User as UserType } from '@/types'
import Input from '@/components/ui/input/Input.vue'
import MemberComponent from './components/Member.vue'

const route = useRoute()
const workspaceId = route.params.workspaceId

const workspace = ref<Workspace | null>(null)
const tab = ref<'BOARD' | 'CLIENT' | 'SETTINGS'>('BOARD')

async function getWorkspaceData() {
  try {
    const { data } = await api.get(`/workspace/get/${workspaceId}`)
    workspace.value = data.workspace
  } catch (error) {}
}

const shareState = reactive({
  toggleOpen: false,
  loading: false,
  users: [] as Member[],
  emailInput: '',
  permissionInput: 'VIEW' as 'VIEW' | 'EDIT',
  error: null as null | string
})

async function getWorkspaceUsers() {
  try {
    shareState.loading = true
    const { data } = await api.get(`/workspace/member/getall/${workspaceId}`)
    shareState.users = data.users
  } catch (error: any) {
    shareState.error = error.message
  } finally {
    shareState.loading = false
  }
}

async function addWorkspaceUser() {
  try {
    shareState.loading = true
    await api.post(`/workspace/member/add`, {
      email: shareState.emailInput,
      permission: shareState.permissionInput,
      workspace_id: workspaceId
    })
    shareState.error = null
    shareState.emailInput = ''
    shareState.permissionInput = 'VIEW'
    getWorkspaceUsers()
  } catch (error: any) {
    shareState.error = error.message
  } finally {
    shareState.loading = false
  }
}

onMounted(() => {
  getWorkspaceData() // get the workspace's data
})

watch(
  () => shareState.toggleOpen,
  () => {
    if (shareState.toggleOpen) {
      getWorkspaceUsers()
    }
  }
)
</script>
<template>
  <private-view>
    <Dialog v-model:open="shareState.toggleOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle class="text-2xl font-semibold">Share table</DialogTitle>
        </DialogHeader>
        <div class="grid grid-cols-[6fr_3fr_1fr] gap-2">
          <Input placeholder="Enter e-mail address" v-model="shareState.emailInput" />
          <Select v-model="shareState.permissionInput">
            <SelectTrigger>
              <SelectValue placeholder="Select permission" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Permissions</SelectLabel>
                <SelectItem value="VIEW"> View </SelectItem>
                <SelectItem value="EDIT"> Edit </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button @click="addWorkspaceUser">Share</Button>
        </div>
        <div v-if="shareState.error" class="text-red-500">{{ shareState.error }}</div>
        <div v-if="shareState.users && workspace">
          <MemberComponent
            v-for="member in shareState.users"
            :member="member"
            :workspace="workspace"
            :reload-members="getWorkspaceUsers"
          />
        </div>
      </DialogContent>
    </Dialog>
    <div class="h-[calc(100vh-4rem)] grid grid-rows-[1fr_9fr]">
      <!-- Top grid workspace nav -->
      <div class="text-xl flex gap-4 items-center justify-between p-6 border-2">
        <div class="flex items-center justify-center gap-2">
          <div class="border-2 border-zinc-300 p-2 rounded-md">
            <Table2 :size="20" />
          </div>
          <div class="flex items-center" v-if="workspace">
            <div>
              <RouterLink
                class="text-zinc-800 block font-semibold hover:text-red-500"
                to="/dashboard"
                >Workspaces</RouterLink
              >
            </div>
            <ChevronRight :size="26" />
            <div class="font-normal">{{ workspace.title }}</div>
          </div>
        </div>
        <div>
          <Button @click="shareState.toggleOpen = true" class="flex items-center gap-1 text-base"
            ><UserRoundPlus :size="16" /> Share</Button
          >
        </div>
      </div>
      <!-- Bottom grid workspace content -->
      <div class="grid grid-cols-[1.5fr_9fr]">
        <!-- Side nav -->
        <div class="w-full flex flex-col">
          <NavButton :icon="Table2" :tab="tab" targetTab="BOARD" :set-tab="() => (tab = 'BOARD')" />
          <NavButton :icon="User" :tab="tab" targetTab="CLIENT" :set-tab="() => (tab = 'CLIENT')" />
          <NavButton
            :icon="Settings"
            :tab="tab"
            targetTab="SETTINGS"
            :set-tab="() => (tab = 'SETTINGS')"
          />
        </div>
        <!-- Content -->

        <div>
          <div v-if="workspace" class="w-full h-full bg-zinc-200 relative">
            <div v-if="tab === 'BOARD'">
              <BoardTab :workspace="workspace" />
            </div>
            <div v-if="tab === 'CLIENT'">
              <ClientTab :workspace="workspace" />
            </div>
            <div v-if="tab === 'SETTINGS'">
              <SettingsTab :workspace="workspace" :reload-workspace="getWorkspaceData" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </private-view>
</template>
