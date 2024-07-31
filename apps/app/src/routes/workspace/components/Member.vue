<script setup lang="ts">
import type { Member, Workspace } from '@/types/workspaces'
import { reactive, watch } from 'vue'

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

import api from '@/services/api'
import Button from '@/components/ui/button/Button.vue'
import { UserX, Loader2 as LoaderSpinner } from 'lucide-vue-next'

const props = defineProps<{
  workspace: Workspace
  member: Member
  reloadMembers: () => Promise<void>
}>()

const memberState = reactive({
  permission: props.member.permission as 'EDIT' | 'VIEW'
})

const removeState = reactive({
  isDialogOpen: false,
  loading: false,
  error: null as string | null
})

async function updateMemberPermission() {
  try {
    await api.patch(`/workspace/member/update`, {
      workspace_id: props.workspace.id,
      user_id: props.member.user.id,
      permission: memberState.permission
    })
  } catch (error) {
    throw error
  }
}

async function removeMember() {
  try {
    removeState.loading = true
    await api.delete(`/workspace/member/remove/${props.workspace.id}/${props.member.user.id}`)
    await props.reloadMembers()
  } catch (error) {
    throw error
  } finally {
    removeState.loading = false
    removeState.isDialogOpen = false
  }
}

watch(() => memberState.permission, updateMemberPermission, { immediate: false })
</script>
<template>
  <Dialog v-model:open="removeState.isDialogOpen">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Remove Member</DialogTitle>
        <DialogDescription>
          Are you sure you want to remove {{ member.user.firstname }}
          {{ member.user.lastname }} from the workspace?
        </DialogDescription>
      </DialogHeader>

      <DialogFooter>
        <Button @click="removeMember"
          ><LoaderSpinner v-if="removeState.loading" :size="16" /> Sure</Button
        >
        <Button @click="removeState.isDialogOpen = false" class="bg-zinc-800 hover:bg-zinc-700"
          >Cancel</Button
        >
      </DialogFooter>
    </DialogContent>
  </Dialog>
  <div class="flex justify-between items-center mb-4">
    <div class="flex gap-2">
      <div
        class="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center text-base"
      >
        {{ member.user.firstname[0] }}{{ member.user.lastname[0] }}
      </div>
      <div class="text-sm">
        <div class="font-bold">{{ member.user.firstname }} {{ member.user.lastname }}</div>
        <div>{{ member.user.email }}</div>
      </div>
    </div>
    <div class="flex gap-1">
      <Select v-model="memberState.permission">
        <SelectTrigger>
          <SelectValue placeholder="Select permission" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Permissions</SelectLabel>
            <SelectItem value="EDIT"> Edit </SelectItem>
            <SelectItem value="VIEW"> View </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <Button @click="removeState.isDialogOpen = true" class="p-2">
        <UserX :size="16" />
      </Button>
    </div>
  </div>
</template>
