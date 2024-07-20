<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAppStore } from './stores/app'
import { useHead } from '@unhead/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const appStore = useAppStore()
const { isHydrating } = storeToRefs(appStore)
useHead({
  titleTemplate: (title?: string) => {
    const projectName = 'Onboarding'
    return !title ? projectName : `${title}`
  }
})

const error = computed(() => appStore.error)
</script>

<template>
  <transition name="fade">
    <div v-if="isHydrating" class="fixed z-50 flex h-screen w-screen items-center justify-center">
      <v-spinner></v-spinner>
    </div>
  </transition>
  <div v-if="error">
    {{ t('unexpected_error_copy') }}
  </div>
  <router-view v-else-if="!isHydrating"></router-view>
</template>
