<script setup lang="ts">
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from '@/components/ui/button/Button.vue'
import type { Workspace } from '@/types/workspaces'
import { Plus, Loader2 as LoaderSpinner } from 'lucide-vue-next'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import Input from '@/components/ui/input/Input.vue'
import api from '@/services/api'

const props = defineProps<{
  workspace: Workspace
}>()
const { t } = useI18n()

const createState = reactive({
  isDialogOpen: false,
  loading: false,
  input: ''
})

async function createList() {
  createState.loading = true
  try {
    await api.post(`/pipeline/create`, {
      title: createState.input,
      workspace_id: props.workspace.id
    })
    createState.isDialogOpen = false
  } catch (error) {
    console.error(error)
  } finally {
    createState.loading = false
  }
}
</script>
<template>
  <Dialog v-model:open="createState.isDialogOpen">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ t('new_list') }}</DialogTitle>
        <DialogDescription>
          {{ t('new_list_description') }}
        </DialogDescription>
      </DialogHeader>
      <Input v-model="createState.input" :placeholder="t('list_placeholder')" />
      <div class="flex justify-end gap-1">
        <Button @click="createList">
          <LoaderSpinner v-if="createState.loading" class="mr-2 size-4 animate-spin" />
          {{ t('save') }}</Button
        >
        <Button @click="createState.isDialogOpen = false" class="bg-zinc-800 hover:bg-zinc-700">
          <span>
            {{ t('cancel') }}
          </span>
        </Button>
      </div>
    </DialogContent>
  </Dialog>
  <div class="absolute top-0 left-0 w-full h-full p-10">
    <div class="absolute top-4 right-4">
      <Button class="flex gap-2" @click="createState.isDialogOpen = true"
        >{{ t('new_list') }} <Plus :size="16" />
      </Button>
    </div>
  </div>
</template>
