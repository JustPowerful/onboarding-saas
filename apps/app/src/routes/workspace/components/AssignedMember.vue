<script lang="ts" setup>
import type { ClientAssignment } from '@/types/workspaces'
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
import { reactive } from 'vue'

const props = defineProps<{
  member: ClientAssignment['members'][0]
  removeMember: () => Promise<void>
}>()

const removeState = reactive({
  isDialogOpen: false,
  loading: false,
  error: null as null | string
})
</script>
<template>
  <Dialog v-model:open="removeState.isDialogOpen">
    <DialogTrigger>
      <div
        class="w-6 h-6 rounded-full bg-red-400 flex items-center justify-center text-xs text-white -ml-2 border border-white hover:scale-105"
      >
        {{ member.user.firstname[0] }}
      </div>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Remove {{ member.user.firstname }} {{ member.user.lastname }}?</DialogTitle>
        <DialogDescription>
          Do you want to remove this member from the assignment?
        </DialogDescription>
      </DialogHeader>

      <DialogFooter>
        <Button
          @click="
            () => {
              removeState.loading = true
              removeState.error = null
              removeMember()
                .catch((error: any) => {
                  removeState.error = error.message
                })
                .finally(() => {
                  removeState.loading = false
                  removeState.isDialogOpen = false
                })
            }
          "
          >Sure, remove</Button
        >

        <Button @click="removeState.isDialogOpen = false" class="bg-zinc-800 hover:bg-zinc-700"
          >Cancel</Button
        >
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
