// ---- Template ----
<template>
  <div class="auth-verification-summary">
    <q-icon name="mark_email_unread" />
    <div>
      <span>{{ t('auth.codeSentTo') }}</span>
      <strong>{{ email }}</strong>
    </div>
  </div>

  <q-form class="auth-form" @submit="handleVerify">
    <q-input
      v-model="code"
      :label="t('auth.verificationCode')"
      autocomplete="one-time-code"
      inputmode="numeric"
      maxlength="6"
      mask="######"
      outlined
      dense
      autofocus
      class="auth-field auth-code-field"
      :rules="[
        val => val && val.length > 0 || t('auth.verificationCodeRequired'),
        val => val && val.length === 6 || t('auth.verificationCodeInvalid'),
      ]"
    >
      <template #prepend>
        <q-icon name="pin" />
      </template>
    </q-input>

    <div v-if="notice" class="auth-notice">
      {{ notice }}
    </div>

    <div v-if="authStore.error" class="auth-error">
      {{ authStore.error }}
    </div>

    <q-btn
      type="submit"
      :label="t('auth.verifyResetCode')"
      icon-right="arrow_forward"
      color="primary"
      size="lg"
      class="auth-submit"
      :disable="authStore.isLoading"
      unelevated
    />
  </q-form>

  <div class="auth-switch auth-switch--stack">
    <q-btn
      flat
      no-caps
      class="auth-resend-btn"
      icon="refresh"
      :label="resendLabel"
      :disable="resendSeconds > 0 || authStore.isLoading"
      @click="handleResend"
    />

    <router-link :to="{ name: ROUTE_NAMES.LOGIN }" class="auth-link auth-link--standalone">
      {{ t('auth.verificationBackToSignIn') }}
    </router-link>
  </div>
</template>

// ---- Script Setup ----
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
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
const code = ref('');
const notice = ref<string | null>(null);
const resendSeconds = ref(0);
const isResending = ref(false);
let resendTimer: number | undefined;

const resendLabel = computed(() =>
  resendSeconds.value > 0
    ? t('auth.resendIn', { seconds: resendSeconds.value })
    : t('auth.resendCode'),
);

const startResendTimer = (seconds: number) => {
  if (resendTimer) {
    window.clearInterval(resendTimer);
  }

  resendSeconds.value = Math.max(0, Math.ceil(seconds));
  if (resendSeconds.value === 0) {
    return;
  }

  resendTimer = window.setInterval(() => {
    resendSeconds.value = Math.max(0, resendSeconds.value - 1);
    if (resendSeconds.value === 0 && resendTimer) {
      window.clearInterval(resendTimer);
      resendTimer = undefined;
    }
  }, 1000);
};

const routeCooldown = () => {
  const rawCooldown = Array.isArray(route.query.cooldown) ? route.query.cooldown[0] : route.query.cooldown;
  const parsedCooldown = Number(rawCooldown);
  return Number.isFinite(parsedCooldown) ? parsedCooldown : 0;
};

onMounted(() => {
  if (!email.value) {
    void router.replace({ name: ROUTE_NAMES.FORGOT_PASSWORD });
    return;
  }

  authStore.setPendingPasswordResetEmail(email.value);
  startResendTimer(routeCooldown());
});

onBeforeUnmount(() => {
  if (resendTimer) {
    window.clearInterval(resendTimer);
  }
});

const handleVerify = async () => {
  authStore.clearError();
  notice.value = null;

  const response = await authStore.verifyPasswordResetCode({
    email: email.value,
    code: code.value.trim(),
  });

  if (response.success && response.resetToken) {
    await router.push({
      name: ROUTE_NAMES.RESET_PASSWORD,
      query: { email: response.email || email.value },
    });
  }
};

const handleResend = async () => {
  if (resendSeconds.value > 0) {
    return;
  }

  isResending.value = true;
  authStore.clearError();
  notice.value = null;

  const response = await authStore.forgotPassword({ email: email.value });
  if (response.resendAvailableInSeconds) {
    startResendTimer(response.resendAvailableInSeconds);
  }
  if (response.success) {
    notice.value = response.message || t('auth.resetCodeSent');
  }

  isResending.value = false;
};
</script>
