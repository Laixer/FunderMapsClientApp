<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useSessionStore } from '@/stores/session'
import AuthWrapper from '@/components/Layout/AuthWrapper.vue'

const { t } = useI18n()
const router = useRouter()
const sessionStore = useSessionStore()

const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const submitting = ref(false)

async function onSubmit() {
  if (submitting.value) return
  submitting.value = true
  error.value = null
  try {
    await sessionStore.login(email.value, password.value)
    router.push({ name: 'dashboard' })
  } catch {
    error.value = t('auth.invalidCredentials')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthWrapper :title="t('app.title')">
    <form
      class="card w-full max-w-sm space-y-4 rounded-lg bg-white p-8 shadow-card"
      @submit.prevent="onSubmit"
    >
      <h2 class="text-xl text-blue-900">{{ t('auth.login') }}</h2>

      <label class="block">
        <span class="text-sm text-grey-800">{{ t('auth.email') }}</span>
        <input
          v-model="email"
          type="email"
          autocomplete="email"
          required
          class="mt-1 w-full rounded border border-grey-400 p-2"
        />
      </label>

      <label class="block">
        <span class="text-sm text-grey-800">{{ t('auth.password') }}</span>
        <input
          v-model="password"
          type="password"
          autocomplete="current-password"
          required
          class="mt-1 w-full rounded border border-grey-400 p-2"
        />
      </label>

      <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

      <button
        type="submit"
        :disabled="submitting"
        class="button w-full rounded bg-green-500 p-2 text-white disabled:opacity-50"
      >
        {{ t('auth.login') }}
      </button>
    </form>
  </AuthWrapper>
</template>
