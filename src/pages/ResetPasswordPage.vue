<template>
  <q-form class="auth-form" @submit="handleReset">
    <q-input
      v-model="formData.password"
      :label="t('auth.newPassword')"
      :type="showPassword ? 'text' : 'password'"
      autocomplete="new-password"
      outlined
      dense
      autofocus
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
      :label="t('auth.confirmNewPassword')"
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
      :label="t('auth.resetPassword')"
      icon-right="arrow_forward"
      color="primary"
      size="lg"
      class="auth-submit"
      :disable="authStore.isLoading"
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
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from 'src/stores/auth';
import { ROUTE_NAMES } from 'src/router/route-names';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const authStore = useAuthStore();

const queryEmail = route.query.email;
const initialEmail = Array.isArray(queryEmail) ? queryEmail[0] : queryEmail;
const email = ref(initialEmail || authStore.pendingPasswordResetEmail || '');
const showPassword = ref(false);
const showPasswordConfirm = ref(false);

const formData = reactive({
  password: '',
  passwordConfirm: '',
});

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

const togglePasswordConfirmVisibility = () => {
  showPasswordConfirm.value = !showPasswordConfirm.value;
};

const handleReset = async () => {
  authStore.clearError();

  if (!email.value || !authStore.passwordResetToken) {
    await router.push({ name: ROUTE_NAMES.FORGOT_PASSWORD });
    return;
  }

  const response = await authStore.resetPassword({
    email: email.value,
    resetToken: authStore.passwordResetToken,
    password: formData.password,
    passwordConfirm: formData.passwordConfirm,
  });

  if (response.success) {
    await router.push({ name: ROUTE_NAMES.LOGIN });
  }
};
</script>
