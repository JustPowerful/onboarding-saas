<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'

import { ChevronRight, Settings, Table2, User } from 'lucide-vue-next'

import type { Workspace } from '@/types/workspaces'
import NavButton from './components/NavButton.vue'
import BoardTab from './components/tabs/board-tab.vue'
import ClientTab from './components/tabs/client-tab.vue'
import SettingsTab from './components/tabs/settings-tab.vue'

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
onMounted(() => {
  getWorkspaceData() // get the workspace's data
})
</script>
<template>
  <private-view>
    <div class="h-[calc(100vh-4rem)] grid grid-rows-[1fr_9fr]">
      <!-- Top grid workspace nav -->
      <div class="text-xl font-medium flex gap-4 items-center justify-between p-6 border-2">
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
              <SettingsTab :workspace="workspace" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </private-view>
</template>
