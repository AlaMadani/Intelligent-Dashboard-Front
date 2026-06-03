<template>
  <q-form class="auth-form" @submit="handleSubmit">
    <q-input
      v-model="email"
      :label="t('auth.email')"
      type="email"
      autocomplete="email"
      autofocus
      outlined
      dense
      :rules="[
        val => val && val.length > 0 || t('auth.emailRequired'),
        val => isValidEmail(val) || t('auth.invalidEmail'),
      ]"
      class="auth-field"
    >
      <template #prepend>
        <q-icon name="alternate_email" />
      </template>
    </q-input>

    <div v-if="authStore.error" class="auth-error">
      {{ authStore.error }}
    </div>

    <q-btn
      type="submit"
      :label="t('auth.sendResetCode')"
      icon-right="arrow_forward"
      color="primary"
      size="lg"
      class="auth-submit"
      :loading="authStore.isLoading"
      unelevated
    />
  </q-form>

  <div class="auth-switch">
    <router-link :to="{ name: ROUTE_NAMES.LOGIN }" class="auth-link auth-link--standalone">
      {{ t('auth.verificationBackToSignIn') }}
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from 'src/stores/auth';
import { ROUTE_NAMES } from 'src/router/route-names';

const router = useRouter();
const { t } = useI18n();
const authStore = useAuthStore();
const email = ref(authStore.pendingPasswordResetEmail || '');

const isValidEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const handleSubmit = async () => {
  authStore.clearError();

  const response = await authStore.forgotPassword({ email: email.value.trim() });
  if (response.passwordResetRequired && response.email) {
    await router.push({
      name: ROUTE_NAMES.RESET_PASSWORD_CODE,
      query: {
        email: response.email,
        cooldown: String(response.resendAvailableInSeconds ?? 0),
      },
    });
  }
};
</script>
