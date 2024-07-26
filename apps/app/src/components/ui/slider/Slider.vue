<script setup lang="ts">
import type { SliderRootEmits, SliderRootProps } from 'radix-vue'
import { SliderRange, SliderRoot, SliderThumb, SliderTrack, useEmitAsProps } from 'radix-vue'
import { cn } from '@/lib/shadcn'

const props = defineProps<SliderRootProps>()
const emits = defineEmits<SliderRootEmits>()

const emitsAsProps = useEmitAsProps(emits)
</script>

<template>
  <SliderRoot
    :class="cn('relative flex w-full touch-none select-none items-center', $attrs.class ?? '')"
    v-bind="{ ...props, ...emitsAsProps }"
  >
    <SliderTrack class="bg-secondary relative h-2 w-full grow overflow-hidden rounded-full">
      <SliderRange class="bg-primary absolute h-full" />
    </SliderTrack>
    <SliderThumb
      class="border-primary bg-background ring-offset-background focus-visible:ring-ring block h-5 w-5 rounded-full border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
    />
  </SliderRoot>
</template>
