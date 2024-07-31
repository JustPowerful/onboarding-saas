<script setup lang="ts">
import type { ClientAssignment } from '@/types/workspaces'
import { Edit, Ellipsis } from 'lucide-vue-next'

import { Sheet, SheetContent, SheetHeader, SheetTrigger } from '@/components/ui/sheet'

const props = defineProps<{
  data: ClientAssignment
}>()
</script>
<template>
  <div class="bg-white p-3 border-2 border-zinc-200 rounded-md flex justify-between items-center">
    {{ data.client.name }}
    <Sheet>
      <SheetTrigger>
        <button class="text-zinc-500">
          <Ellipsis :size="16" />
        </button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <div class="flex items-center gap-2">
            <span class="text-2xl font-bold">{{ data.client.name }}</span>
            <button><Edit :size="20" /></button>
          </div>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  </div>
</template>
