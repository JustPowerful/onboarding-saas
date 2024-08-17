<script setup lang="ts">
import Button from '@/components/ui/button/Button.vue'
import Input from '@/components/ui/input/Input.vue'
import api from '@/services/api'
import type { Workspace } from '@/types/workspaces'
import { Loader2, Save } from 'lucide-vue-next'
import { reactive } from 'vue'

const props = defineProps<{
  workspace: Workspace
  reloadWorkspace: () => Promise<void>
}>()

const editState = reactive({
  loading: false,
  error: null as null | string,
  title: props.workspace.title
})

async function updateWorkspace() {
  try {
    editState.loading = true
    await api.patch(`/workspace/update/${props.workspace.id}`, {
      title: editState.title
    })
    await props.reloadWorkspace()
  } catch (error) {
  } finally {
    editState.loading = false
  }
}
</script>
<template>
  <div class="p-4">
    <label class="text-sm font-semibold block mb-2">Workspace title </label>
    <Input placeholder="Workspace's title" v-model="editState.title" />
    <Button @click="updateWorkspace" class="mt-2 w-full flex items-center gap-1">
      <Loader2 v-if="editState.loading" :size="16" class="animate-spin" />
      <Save :size="16" />
      Save
    </Button>
  </div>
</template>
