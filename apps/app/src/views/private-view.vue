<script setup lang="ts">
import Header from './components/v-header.vue'
import SideBar from './components/v-side-bar.vue'

import { storeToRefs } from 'pinia'
import { useAppStore } from '@/stores/app'
import { provide, ref, toRefs } from 'vue'
import { router } from '@/router'
import { useHead } from '@unhead/vue'

const appStore = useAppStore()
const { isSideBarOpen } = storeToRefs(appStore)

const props = withDefaults(
  defineProps<{
    title?: string | null
  }>(),
  {
    title: null
  }
)

const { title } = toRefs(props)

const contentEl = ref<HTMLElement>()
provide('main-element', contentEl)
router.afterEach(() => {
  contentEl.value?.scrollTo({ top: 0 })
})

useHead({
  title: title
})
</script>

<template>
  <div class="flex h-screen w-full overflow-hidden">
    <div class="flex w-full flex-col">
      <Header></Header>
      <!-- This is where your child components will be rendered -->
      <div id="main-content" ref="contentEl" class="relative w-full">
        <div class="h-[calc(100vh-4rem)] min-h-full w-full overflow-y-auto">
          <slot></slot>
        </div>
      </div>
    </div>
  </div>
</template>
