<template>
  <q-form class="auth-form" @submit="handleSignUp">
    <q-input
      v-model="formData.fullName"
      :label="t('auth.fullName')"
      autocomplete="name"
      autofocus
      outlined
      dense
      :rules="[
        val => val && val.length > 0 || t('auth.fullNameRequired'),
        val => val && val.length >= 2 || t('auth.fullNameTooShort'),
      ]"
      class="auth-field"
    >
      <template #prepend>
        <q-icon name="badge" />
      </template>
    </q-input>

    <q-input
      v-model="formData.email"
      :label="t('auth.email')"
      type="email"
      autocomplete="email"
      outlined
      dense
      :rules="[
        val => val && val.length > 0 || t('auth.emailRequired'),
        val => isValidEmail(val) || t('auth.invalidEmail'),
        val => isAllowedDomain(val) || t('auth.emailDomainNotAllowed'),
      ]"
      class="auth-field"
      :hint="t('auth.emailHint')"
    >
      <template #prepend>
        <q-icon name="alternate_email" />
      </template>
    </q-input>

    <q-input
      v-model="formData.password"
      :label="t('auth.password')"
      :type="showPassword ? 'text' : 'password'"
      autocomplete="new-password"
      outlined
      dense
      :rules="[
        val => val && val.length > 0 || t('auth.passwordRequired'),
        val => val && val.length >= 8 || t('auth.passwordTooShort'),
      ]"
      class="auth-field"
      :hint="t('auth.passwordHint')"
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

    <q-input
      v-model="formData.passwordConfirm"
      :label="t('auth.confirmPassword')"
      :type="showPasswordConfirm ? 'text' : 'password'"
      autocomplete="new-password"
      outlined
      dense
      :rules="[
        val => val && val.length > 0 || t('auth.confirmPasswordRequired'),
        val => val === formData.password || t('auth.passwordMismatch'),
      ]"
      class="auth-field"
    >
      <template #prepend>
        <q-icon name="verified_user" />
      </template>
      <template #append>
        <q-btn
          type="button"
          flat
          dense
          round
          :icon="showPasswordConfirm ? 'visibility_off' : 'visibility'"
          :aria-label="t('auth.togglePasswordVisibility')"
          @click.stop.prevent="togglePasswordConfirmVisibility"
        />
      </template>
    </q-input>

    <div v-if="authStore.error" class="auth-error">
      {{ authStore.error }}
    </div>

    <q-btn
      type="submit"
      :label="t('auth.signUp')"
      icon-right="arrow_forward"
      color="primary"
      size="lg"
      class="auth-submit"
      :loading="authStore.isLoading"
      unelevated
    />
  </q-form>

  <div class="auth-switch">
    <span>{{ t('auth.hasAccount') }}</span>
    <router-link :to="{ name: ROUTE_NAMES.LOGIN }" class="auth-link">{{ t('auth.signInLink') }}</router-link>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from 'src/stores/auth';
import { ROUTE_NAMES } from 'src/router/route-names';
import type { SignUpRequest } from 'src/types/auth';

const router = useRouter();
const { t } = useI18n();
const authStore = useAuthStore();
const showPassword = ref(false);
const showPasswordConfirm = ref(false);

const formData = reactive<SignUpRequest>({
  fullName: '',
  email: '',
  password: '',
  passwordConfirm: '',
});

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isAllowedDomain = (email: string): boolean => {
  return email.trim().toLowerCase().endsWith('');
};

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

const togglePasswordConfirmVisibility = () => {
  showPasswordConfirm.value = !showPasswordConfirm.value;
};

const handleSignUp = async () => {
  authStore.clearError();

  if (!formData.fullName || !formData.email || !formData.password || !formData.passwordConfirm) {
    return;
  }

  const response = await authStore.signUp(formData);
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
