<template>
  <q-form class="auth-form" @submit="handleSignIn">
    <q-input
      v-model="formData.email"
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

    <q-input
      v-model="formData.password"
      :label="t('auth.password')"
      :type="showPassword ? 'text' : 'password'"
      autocomplete="current-password"
      outlined
      dense
      :rules="[val => val && val.length > 0 || t('auth.passwordRequired')]"
      class="auth-field"
    >
      <template #prepend>
        <q-icon name="lock" />
      </template>
      <template #append>
        <q-btn
          type="button"
          flat
          dense
          round
          :icon="showPassword ? 'visibility_off' : 'visibility'"
          :aria-label="t('auth.togglePasswordVisibility')"
          @click.stop.prevent="togglePasswordVisibility"
        />
      </template>
    </q-input>

    <div class="auth-inline-action">
      <router-link :to="{ name: ROUTE_NAMES.FORGOT_PASSWORD }" class="auth-link auth-link--standalone">
        {{ t('auth.forgotPassword') }}
      </router-link>
    </div>

    <div v-if="authStore.error" class="auth-error">
      {{ authStore.error }}
    </div>

    <q-btn
      type="submit"
      :label="t('auth.signIn')"
      icon-right="arrow_forward"
      color="primary"
      size="lg"
      class="auth-submit"
      :disable="authStore.isLoading"
      unelevated
    />
  </q-form>

  <div class="auth-switch">
    <span>{{ t('auth.noAccount') }}</span>
    <router-link :to="{ name: ROUTE_NAMES.SIGN_UP }" class="auth-link">{{ t('auth.signUpLink') }}</router-link>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from 'src/stores/auth';
import { ROUTE_NAMES } from 'src/router/route-names';
import type { SignInRequest } from 'src/types/auth';

const router = useRouter();
const { t } = useI18n();
const authStore = useAuthStore();
const showPassword = ref(false);

const formData = reactive<SignInRequest>({
  email: '',
  password: '',
});

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

const handleSignIn = async () => {
  authStore.clearError();

  if (!formData.email || !formData.password) {
    return;
  }

  const response = await authStore.signIn(formData);
  if (response.emailVerificationRequired && response.email) {
    await router.push({
      name: ROUTE_NAMES.VERIFY_EMAIL,
      query: {
        email: response.email,
        cooldown: String(response.resendAvailableInSeconds ?? 0),
        expires: String(response.verificationExpiresInSeconds ?? 0),
      },
    });
    return;
  }

  if (response.success && response.accessToken) {
    await router.push({ name: ROUTE_NAMES.SECURITY_OVERVIEW });
  }
};
</script>
