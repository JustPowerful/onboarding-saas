<script setup lang="ts">
import { defineProps, type Component } from 'vue'
const props = defineProps<{
  targetTab: 'BOARD' | 'CLIENT' | 'SETTINGS'
  tab: 'BOARD' | 'CLIENT' | 'SETTINGS'
  setTab: () => void
  icon: Component
}>()
</script>

<template>
  <button
    @click="setTab"
    :class="`group py-3 flex items-center gap-2 px-6 text-zinc-600 hover:bg-zinc-400 hover:text-black ${
      tab === targetTab ? 'bg-zinc-400 text-black' : ''
    }`"
  >
    <span
      :class="`group-hover:text-red-500  
              ${tab === targetTab ? 'text-red-500' : 'text-zinc-600'}
            `"
      ><icon :size="18"
    /></span>
    <span class="capitalize">{{ targetTab.toLowerCase() }}</span>
  </button>
</template>
