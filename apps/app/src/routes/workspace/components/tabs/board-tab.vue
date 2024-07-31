<script setup lang="ts">
import { onMounted, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from '@/components/ui/button/Button.vue'
import type { Checklist, Workspace } from '@/types/workspaces'
import { Plus, Loader2 as LoaderSpinner } from 'lucide-vue-next'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import Input from '@/components/ui/input/Input.vue'
import api from '@/services/api'
import List from '../List.vue'

import draggable from 'vuedraggable'

const props = defineProps<{
  workspace: Workspace
}>()
const { t } = useI18n()

const createState = reactive({
  isDialogOpen: false,
  loading: false,
  input: ''
})

const lists = reactive<{
  data: Checklist[] // specifying the type of the data
  loading: boolean
  error: string | null
}>({
  data: [],
  loading: false,
  error: null
})

async function createList() {
  createState.loading = true
  try {
    await api.post(`/pipeline/create`, {
      title: createState.input,
      workspace_id: props.workspace.id
    })
    createState.isDialogOpen = false
    getLists()
  } catch (error) {
    console.error(error)
  } finally {
    createState.loading = false
  }
}

async function getLists() {
  try {
    lists.loading = true
    const { data } = await api.get(`/pipeline/getall/${props.workspace.id}`)
    lists.data = data.pipelines
  } catch (error: any) {
    lists.error = error.message
  } finally {
    lists.loading = false
  }
}

async function saveOrder() {
  try {
    await api.patch(`/pipeline/updateorder/${props.workspace.id}`, {
      pipelines: lists.data
    })
  } catch (error) {
    throw error
  }
}

onMounted(() => {
  getLists()
})
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
  <div class="bg-zinc-100 absolute top-0 left-0 w-full h-full">
    <div class="absolute top-4 right-4 z-40">
      <Button class="flex gap-2" @click="createState.isDialogOpen = true"
        >{{ t('new_list') }} <Plus :size="16" />
      </Button>
    </div>

    <draggable
      class="flex gap-4 overflow-x-scroll h-full py-5 pl-5 pr-32"
      v-if="lists.data.length > 0"
      v-model="lists.data"
      tag="Pipeline"
      item-key="id"
      ghost-class="drag-checklist"
      @end="saveOrder"
    >
      <template #item="{ element: list }">
        <List :checklist="list" :reload-checklists="getLists" :save-order="saveOrder" />
      </template>
    </draggable>
  </div>
</template>
