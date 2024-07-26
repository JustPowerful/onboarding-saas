<script setup lang="ts">
// form imports
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ref } from 'vue'

// other
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'
import { useForm } from 'vee-validate'
import { router } from '@/router'
import { z } from 'zod'
import api from '@/services/api'
import { toTypedSchema } from '@vee-validate/zod'
import { Axios, AxiosError } from 'axios'

const authStore = useAuthStore()
const { t } = useI18n()
const { isLoading } = storeToRefs(authStore)
const formError = ref('')
const formSchema = toTypedSchema(
  z
    .object({
      firstname: z.string().min(2).max(50),
      lastname: z.string().min(2).max(50),
      email: z.string().email(),
      password: z.string().min(6),
      confirm_password: z.string().min(6)
    })
    .superRefine(({ confirm_password, password }, ctx) => {
      if (confirm_password !== password) {
        ctx.addIssue({
          code: 'custom',
          message: 'The password do not match',
          path: ['confirm_password']
        })
      }
    })
)

const form = useForm({
  validationSchema: formSchema
})

const onSubmit = form.handleSubmit(async (values) => {
  try {
    await api.post('/auth/register', values)
  } catch (error: any) {
    if (error instanceof AxiosError) {
      formError.value = error.response?.data?.message
    }
  }
  // after registering the user
  // we use the login method to authenticate the user
  const loginValues = { email: values.email, password: values.password }
  await authStore.login(loginValues)
  if (authStore.isAuthenticated) {
    router.replace({ name: 'dashboard' })
  }
})
</script>
<template>
  <public-view>
    <div class="flex w-full justify-center items-center mb-6">
      <form class="max-w-xs" @submit.prevent="onSubmit">
        <div class="w-full max-w-xs self-center pb-11 text-center">
          <h1 class="pb-2 text-4xl font-extrabold">{{ t('register') }}</h1>
          <p class="font- text-muted-foreground pb-2 text-sm">{{ t('register_text') }}</p>
          <label
            class="text-destructive bg-transparent text-xs"
            :class="[!authStore.isLoading && (authStore.error || formError) ? 'block' : 'hidden']"
            >{{ authStore.error?.code ? t(authStore.error?.code) : authStore.error?.message }}
            {{ t(formError) }}
          </label>
        </div>
        <div class="flex flex-col gap-5">
          <FormField v-slot="{ componentField }" name="firstname">
            <FormItem>
              <FormLabel>{{ t('firstname') }}</FormLabel>
              <FormControl>
                <Input type="text" placeholder="John" v-bind="componentField" />
              </FormControl>
              <FormMessage name="firstname" />
            </FormItem>
          </FormField>
          <FormField v-slot="{ componentField }" name="lastname">
            <FormItem>
              <FormLabel>{{ t('lastname') }}</FormLabel>
              <FormControl>
                <Input type="text" placeholder="Doe" v-bind="componentField" />
              </FormControl>
              <FormMessage name="lastname" />
            </FormItem>
          </FormField>
          <FormField v-slot="{ componentField }" name="email">
            <FormItem>
              <FormLabel>{{ t('email') }}</FormLabel>
              <FormControl>
                <Input type="text" placeholder="example@gmail.com" v-bind="componentField" />
              </FormControl>
              <FormMessage name="email" />
            </FormItem>
          </FormField>
          <FormField v-slot="{ componentField }" name="password">
            <FormItem>
              <FormLabel>{{ t('password') }}</FormLabel>
              <FormControl>
                <Input type="password" :placeholder="t('password')" v-bind="componentField" />
              </FormControl>
              <FormMessage name="password" />
            </FormItem>
          </FormField>
          <FormField v-slot="{ componentField }" name="confirm_password">
            <FormItem>
              <FormLabel>{{ t('confirm_password') }}</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  :placeholder="t('confirm_password')"
                  v-bind="componentField"
                />
              </FormControl>
              <FormMessage name="confirm_password" />
            </FormItem>
          </FormField>
          <router-link
            :to="{ name: 'login' }"
            class="text-info text-sm font-semibold hover:underline"
            >{{ t('you_have_an_account') }}</router-link
          >
          <Button class="bg-zinc-900 hover:bg-zinc-800" :disabled="isLoading">
            <LoaderSpinner v-if="isLoading" class="mr-2 size-4 animate-spin" />
            <span>{{ t('sign_in') }}</span>
          </Button>
        </div>
      </form>
    </div>
  </public-view>
</template>
