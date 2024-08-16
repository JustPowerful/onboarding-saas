<script setup lang="ts">
import api from '@/services/api'
import type { Task } from '@/types/workspaces'
import {
  CalendarIcon,
  ChevronRight,
  CircleCheckBig,
  Edit,
  Loader2,
  Trash,
  UserPlus
} from 'lucide-vue-next'
import { reactive, watch } from 'vue'

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

import {
  DateFormatter,
  type DateValue,
  getLocalTimeZone,
  toCalendarDate,
  today
} from '@internationalized/date'
const df = new DateFormatter('en-US', {
  dateStyle: 'long'
})

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import Input from '@/components/ui/input/Input.vue'
import Avatar from '@/components/ui/avatar/Avatar.vue'
import AvatarFallback from '@/components/ui/avatar/AvatarFallback.vue'
import AssignedMember from './AssignedMember.vue'
import formatDateString from '@/utils/formate-date-string'
import Button from '@/components/ui/button/Button.vue'
import Textarea from '@/components/ui/textarea/Textarea.vue'
import { cn } from '@/lib/shadcn'
import Calendar from '@/components/ui/calendar/Calendar.vue'

const props = defineProps<{
  task: Task
  refreshClientAssignment: () => Promise<void>
}>()

const memberSearchState = reactive({
  isDialogOpen: false,
  search: '',
  members: [] as any[],
  loading: false,
  error: null as null | string
})

const updateTaskState = reactive({
  isDialogOpen: false,
  error: null as null | string,
  loading: false,
  data: {
    title: props.task.title,
    description: props.task.description,
    deadline: props.task.deadline
      ? (new Date(props.task.deadline as any) as unknown as DateValue)
      : null
  }
})

const deleteTaskState = reactive({
  isDialogOpen: false,
  error: null as null | string,
  loading: false
})

async function updateTask() {
  try {
    updateTaskState.loading = true
    await api.patch(`/task/update/${props.task.id}`, {
      title: updateTaskState.data.title,
      description: updateTaskState.data.description,
      deadline: updateTaskState.data.deadline
    })
    // update the props
    props.task.title = updateTaskState.data.title
    props.task.description = updateTaskState.data.description
    props.task.deadline = updateTaskState.data.deadline as DateValue
    updateTaskState.isDialogOpen = false
  } catch (error: any) {
    updateTaskState.error = error.message
  } finally {
    updateTaskState.loading = false
  }
}

async function getUnassignedMembers() {
  try {
    const { data } = await api.get(
      `/task/member/getunassigned?task_id=${props.task.id}&search=${memberSearchState.search}`
    )
    memberSearchState.members = data.members
  } catch (error: any) {
    memberSearchState.error = error.message
    throw error
  }
}

async function completeTask() {
  try {
    const { data } = await api.patch('/task/complete', {
      task_id: props.task.id
    })
    props.task.completed = true
  } catch (error) {
    throw error
  }
}
async function uncompleteTask() {
  try {
    const { data } = await api.patch('/task/uncomplete', {
      task_id: props.task.id
    })
    props.task.completed = false
  } catch (error) {
    throw error
  }
}

async function addMember(memberId: string) {
  try {
    await api.post('/task/member/add', {
      task_id: props.task.id,
      user_id: memberId
    })
    await props.refreshClientAssignment()
    await getUnassignedMembers()
  } catch (error: any) {
    memberSearchState.error = error.message
    throw error
  }
}

async function removeMember(memberId: string) {
  try {
    await api.delete(`/task/member/remove/${props.task.id}/${memberId}`)
    await props.refreshClientAssignment()
  } catch (error) {
    throw error
  }
}

async function deleteTask() {
  try {
    deleteTaskState.loading = true
    await api.delete(`/task/delete/${props.task.id}`)
    props.refreshClientAssignment()
  } catch (error: any) {
    deleteTaskState.error = error.message
  } finally {
    deleteTaskState.loading = false
  }
}

watch(
  () => memberSearchState.isDialogOpen,
  () => {
    if (memberSearchState.isDialogOpen) {
      getUnassignedMembers()
    }
  }
)
</script>
<template>
  <div class="group relative w-full border-2 border-zinc-400 rounded-md py-3 px-2 flex flex-col">
    <div class="absolute top-1 right-2">
      <button
        @click="completeTask"
        v-if="!task.completed"
        class="text-zinc-600 text-sm flex items-center gap-1"
      >
        <CircleCheckBig :size="16" />
        mark as complete
      </button>
      <button @click="uncompleteTask" v-else class="flex items-center gap-1 text-green-600 text-sm">
        <CircleCheckBig :size="16" /> completed
      </button>
    </div>

    <Sheet>
      <SheetTrigger>
        <button
          class="absolute bottom-2 right-2 hidden group-hover:flex items-center italic text-zinc-400 hover:text-zinc-600"
        >
          Details
          <ChevronRight :size="16" />
        </button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle class="mb-8 flex items-center gap-1">
            <span class="text-2xl font-semibold"> {{ task.title }} </span>
            <button @click="updateTaskState.isDialogOpen = true">
              <Edit :size="20" />
            </button>
          </SheetTitle>
          <div>
            <div class="flex gap-6">
              <div class="text-zinc-700 font-semibold">Created</div>
              <div>{{ df.format(new Date(task.create_at)) }}</div>
            </div>
          </div>
          <div>
            <div class="flex gap-6">
              <div class="text-zinc-700 font-semibold">Description</div>
              <div>{{ task.description }}</div>
            </div>
          </div>
          <div>
            <div class="flex gap-6">
              <div class="text-zinc-700 font-semibold">Deadline</div>
              <div v-if="task.deadline">
                {{ df.format(new Date(task.deadline as any) as unknown as DateValue as any) }}
              </div>
              <div v-else>No deadline</div>
            </div>
          </div>
        </SheetHeader>
        <Dialog v-model:open="deleteTaskState.isDialogOpen">
          <DialogTrigger>
            <Button
              @click="deleteTaskState.isDialogOpen = true"
              class="w-full flex items-center justify-center gap-1 mt-4"
            >
              <Trash :size="16" /> Delete Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete task</DialogTitle>
              <DialogDescription> Are you sure you want to delete this task? </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button class="flex items-center gap-1" @click="deleteTask">
                <Loader2
                  v-if="deleteTaskState.loading"
                  :size="16"
                  class="text-white animate-spin"
                />

                Sure</Button
              >
              <Button
                @click="deleteTaskState.isDialogOpen = false"
                class="bg-zinc-800 hover:bg-zinc-700"
                >Cancel</Button
              >
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
    <div class="mt-4">
      <div class="text-sm">{{ task.title }}</div>
      <div class="flex items-center gap-4">
        <Popover v-model:open="memberSearchState.isDialogOpen">
          <PopoverTrigger>
            <button class="text-zinc-600">
              <UserPlus :size="16" />
            </button>
          </PopoverTrigger>
          <PopoverContent>
            <div class="text-lg font-semibold mb-2">Task staff</div>
            <form @submit.prevent="getUnassignedMembers" class="mb-2">
              <Input v-model="memberSearchState.search" placeholder="Search..." />
            </form>
            <div v-if="memberSearchState.members">
              <div v-for="member in memberSearchState.members" :key="member.id">
                <div
                  @click="
                    () => {
                      addMember(member.id)
                    }
                  "
                  class="p-2 hover:bg-zinc-200 cursor-pointer flex items-center gap-2"
                >
                  <Avatar>
                    <AvatarFallback>
                      {{ member.firstname[0] }}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div class="font-semibold">{{ member.firstname }} {{ member.lastname }}</div>
                    <div class="text-sm text-zinc-500">{{ member.email }}</div>
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <div class="flex items-center">
          <AssignedMember
            v-for="member in task.user_assignments"
            :member="member"
            :remove-member="
              async () => {
                removeMember(member.user.id)
              }
            "
          />
        </div>
      </div>
    </div>
    <!-- Task edit dialog -->
    <Dialog v-model:open="updateTaskState.isDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit task</DialogTitle>
          <DialogDescription>
            Make changes to your task. Hit save to apply changes.
          </DialogDescription>
        </DialogHeader>

        <Input placeholder="Task title" v-model="updateTaskState.data.title" />
        <Textarea placeholder="Task description..." v-model="updateTaskState.data.description" />
        <Popover>
          <PopoverTrigger as-child>
            <Button
              variant="outline"
              :class="
                cn(
                  'justify-start text-left font-normal',
                  !updateTaskState.data.deadline && 'text-muted-foreground'
                )
              "
            >
              <CalendarIcon class="mr-2 h-4 w-4" />
              <!-- {{
                      date
                        ? df.format(date as any)
                        : data.deadline
                          ? df.format(new Date(data.deadline))
                          : 'Pick a date'
                    }} -->
              {{
                updateTaskState.data.deadline
                  ? df.format(updateTaskState.data.deadline as any)
                  : 'Pick a date'
              }}
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-auto p-0">
            <Calendar v-model="updateTaskState.data.deadline" initial-focus />
          </PopoverContent>
        </Popover>
        <DialogFooter>
          <Button @click="updateTask" class="flex items-center gap-1">
            <Loader2 v-if="updateTaskState.loading" :size="16" class="animate-spin" />
            Save</Button
          >
          <Button
            @click="updateTaskState.isDialogOpen = false"
            class="bg-zinc-800 hover:bg-zinc-700"
            >Cancel</Button
          >
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
