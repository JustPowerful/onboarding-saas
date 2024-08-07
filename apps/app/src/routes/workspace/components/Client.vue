<script setup lang="ts">
import type { ClientAssignment, Pipeline } from '@/types/workspaces'
import { Calendar, Edit, Ellipsis, Loader2, Plus, UserPlus } from 'lucide-vue-next'

import { Sheet, SheetContent, SheetHeader, SheetTrigger } from '@/components/ui/sheet'
import { reactive, watch } from 'vue'
import api from '@/services/api'
import draggable from 'vuedraggable'
import Button from '@/components/ui/button/Button.vue'

const props = defineProps<{
  data: ClientAssignment
  pipeline: Pipeline
}>()

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
// import { ScrollArea } from '@/components/ui/scroll-area'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

import Input from '@/components/ui/input/Input.vue'
import Textarea from '@/components/ui/textarea/Textarea.vue'
import Task from './Task.vue'
import type { User } from '@/types'
import Avatar from '@/components/ui/avatar/Avatar.vue'
import AvatarFallback from '@/components/ui/avatar/AvatarFallback.vue'

const clientAssignmentState = reactive({
  toggleSheet: false,
  loading: false,
  data: null as ClientAssignment | null,
  error: null as string | null
})

const createTaskState = reactive({
  isDialogOpen: false,
  loading: false,
  title: '',
  description: '',
  error: null as null | string
})
async function getClientAssignmentData() {
  try {
    clientAssignmentState.loading = true
    const { data } = await api.get(`/clientassignment/get/${props.data.id}`)
    clientAssignmentState.data = data.assignment
  } catch (error) {
    throw error
  } finally {
    clientAssignmentState.loading = false
  }
}

async function createTask() {
  try {
    createTaskState.loading = true
    await api.post('/task/create', {
      title: createTaskState.title,
      description: createTaskState.description,
      client_assignment_id: props.data.id
    })
    getClientAssignmentData()
  } catch (error: any) {
    createTaskState.error = error.message
  } finally {
    createTaskState.loading = false
    createTaskState.isDialogOpen = false
  }
}

watch(
  () => clientAssignmentState.toggleSheet,
  () => {
    if (clientAssignmentState.toggleSheet) {
      getClientAssignmentData()
    }
  }
)

const memberSearchState = reactive({
  isDialogOpen: false,
  search: '',
  loading: false,
  members: [] as User[],
  error: null as string | null
})

async function searchMembers() {
  try {
    memberSearchState.loading = true
    const { data } = await api.get(
      `/clientassignment/member/getunassigned?client_assignment_id=${props.data.id}&search=${memberSearchState.search}`
    )
    memberSearchState.members = data.members
  } catch (error: any) {
    memberSearchState.error = error.message
  } finally {
    memberSearchState.loading = false
  }
}

async function addMember(memberId: string) {
  try {
    await api.post('/clientassignment/member/add', {
      client_assignment_id: props.data.id,
      user_id: memberId
    })
    searchMembers()
    getClientAssignmentData()
  } catch (error: any) {
    memberSearchState.error = error.message
  }
}

watch(
  () => memberSearchState.isDialogOpen,
  () => {
    if (memberSearchState.isDialogOpen) {
      searchMembers()
    }
  }
)
</script>
<template>
  <div class="bg-white p-3 border-2 border-zinc-200 rounded-md flex justify-between items-center">
    <span class="font-semibold">{{ data.client.name }}</span>
    <Sheet v-model:open="clientAssignmentState.toggleSheet">
      <SheetTrigger>
        <button class="text-zinc-500">
          <Ellipsis :size="16" />
        </button>
      </SheetTrigger>
      <SheetContent class="overflow-y-scroll">
        <div v-if="!clientAssignmentState.loading && clientAssignmentState.data">
          <SheetHeader>
            <div class="flex items-center gap-2 mb-10">
              <span class="text-2xl font-bold">{{ clientAssignmentState.data?.client.name }}</span>
              <button><Edit :size="20" /></button>
            </div>
          </SheetHeader>
          <div class="grid grid-cols-2 gap-5 mb-4">
            <div class="text-zinc-700">Assigned Staff</div>
            <div class="flex items-center gap-2">
              <Popover v-model:open="memberSearchState.isDialogOpen">
                <PopoverTrigger> <UserPlus class="text-zinc-500" :size="16" /> </PopoverTrigger>
                <PopoverContent>
                  <div class="text-base font-semibold mb-1">Project Staff</div>
                  <form @submit.prevent="searchMembers" class="mb-2">
                    <Input placeholder="Search..." v-model="memberSearchState.search" />
                  </form>
                  <div v-if="memberSearchState.members">
                    <div v-for="member in memberSearchState.members" :key="member.id">
                      <div
                        class="p-2 hover:bg-zinc-200 cursor-pointer"
                        @click="addMember(member.id)"
                      >
                        <div class="flex items-center">
                          <Avatar>
                            <AvatarFallback
                              >{{ member.firstname[0] }}{{ member.lastname[0] }}</AvatarFallback
                            >
                          </Avatar>
                          <div class="flex flex-col ml-2">
                            <div class="font-semibold">
                              {{ member.firstname }} {{ member.lastname }}
                            </div>
                            <div class="text-zinc-700">{{ member.email }}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <div v-if="clientAssignmentState.data" class="flex">
                <div
                  v-for="member in clientAssignmentState.data.members"
                  class="w-6 h-6 rounded-full bg-red-400 flex items-center justify-center text-xs text-white -ml-2 border border-white hover:scale-105"
                >
                  {{ member.user.firstname[0] }}
                </div>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-5 mb-4">
            <div class="text-zinc-700">Deadline</div>
            <div>
              <button class="flex items-center gap-2 text-zinc-700">
                <Calendar :size="14" /> Add a deadline
              </button>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-5 mb-8">
            <div class="text-zinc-700">Board flow</div>
            <div>
              <div>{{ clientAssignmentState.data?.pipline.title }}</div>
            </div>
          </div>
          <div>
            <div class="text-zinc-800 text-base">Tasks</div>
            <draggable
              v-model="clientAssignmentState.data.tasks"
              :group="{ name: 'tasks' }"
              item-key="id"
              tag="div"
              class="rounded-md flex-grow flex flex-col gap-2"
              ghost-class="drag-task"
            >
              <template #item="{ element: taskData }">
                <Task :task="taskData" />
              </template>
            </draggable>

            <div class="w-full flex justify-end mt-2">
              <!-- Modal and trigger button bellow -->
              <Dialog v-model:open="createTaskState.isDialogOpen">
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create task</DialogTitle>
                    <DialogDescription>
                      Create a task here, save the information before you leave.
                    </DialogDescription>
                  </DialogHeader>

                  <Input placeholder="Task title" v-model="createTaskState.title" />
                  <Textarea
                    placeholder="Task description..."
                    v-model="createTaskState.description"
                  />

                  <DialogFooter>
                    <Button @click="createTask">
                      <Loader2
                        v-if="createTaskState.loading"
                        :size="16"
                        class="animate-spin text-wrap"
                      />
                      Save</Button
                    >
                    <Button
                      class="bg-zinc-800 hover:bg-zinc-700"
                      @click="createTaskState.isDialogOpen = false"
                      >Cancel</Button
                    >
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button @click="createTaskState.isDialogOpen = true" class="flex items-center gap-1">
                Add task
                <Plus :size="16" />
              </Button>
            </div>
          </div>
        </div>
        <div v-else>
          <Loader2 :size="20" class="text-zinc-800 animate-spin" />
        </div>
      </SheetContent>
    </Sheet>
  </div>
</template>
