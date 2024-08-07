<script setup lang="ts">
import type { Task } from '@/types/workspaces'
import { ChevronRight, CircleCheckBig, UserPlus } from 'lucide-vue-next'

const props = defineProps<{
  task: Task
}>()
</script>
<template>
  <div class="group relative w-full border-2 border-zinc-400 rounded-md py-3 px-2 flex flex-col">
    <div class="absolute top-1 right-2">
      <button v-if="!task.completed" class="text-zinc-600 text-sm flex items-center gap-1">
        <CircleCheckBig :size="16" />
        mark as complete
      </button>
      <button v-else class="flex items-center gap-1 text-green-600 text-sm">
        <CircleCheckBig :size="16" /> completed
      </button>
    </div>
    <button
      class="absolute bottom-2 right-2 hidden group-hover:flex items-center italic text-zinc-400 hover:text-zinc-600"
    >
      Details
      <ChevronRight :size="16" />
    </button>
    <div class="mt-4">
      <div class="text-sm">{{ task.title }}</div>
      <div class="">
        <button class="text-zinc-600">
          <UserPlus :size="16" />
        </button>
      </div>
    </div>
  </div>
</template>
