<template>
  <AuthShell
    :title="title"
    :subtitle="subtitle"
    :notice="sessionNotice"
    @dismiss-notice="dismissSessionNotice"
  >
    <component :is="activeComponent" :key="authView" />
  </AuthShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import AuthShell from 'src/components/auth/AuthShell.vue';
import LoginPage from 'src/pages/LoginPage.vue';
import SignUpPage from 'src/pages/SignUpPage.vue';
import VerifyEmailPage from 'src/pages/VerifyEmailPage.vue';
import ForgotPasswordPage from 'src/pages/ForgotPasswordPage.vue';
import ResetPasswordCodePage from 'src/pages/ResetPasswordCodePage.vue';
import ResetPasswordPage from 'src/pages/ResetPasswordPage.vue';
import { SESSION_EXPIRED_NOTICE_KEY, SESSION_EXPIRED_QUERY_VALUE } from 'src/constants/auth';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const sessionExpiredVisible = ref(false);

const authView = computed(() => String(route.params.authView || 'login'));

const syncSessionExpiredNotice = () => {
  const shouldShow =
    authView.value === 'login' &&
    (route.query.session === SESSION_EXPIRED_QUERY_VALUE ||
      localStorage.getItem(SESSION_EXPIRED_NOTICE_KEY) === 'true');

  sessionExpiredVisible.value = shouldShow;

  if (shouldShow) {
    localStorage.removeItem(SESSION_EXPIRED_NOTICE_KEY);
  }
};

const sessionNotice = computed(() =>
  sessionExpiredVisible.value ? t('auth.sessionExpiredNotice') : undefined,
);

const dismissSessionNotice = () => {
  sessionExpiredVisible.value = false;
  localStorage.removeItem(SESSION_EXPIRED_NOTICE_KEY);

  if (route.query.session === SESSION_EXPIRED_QUERY_VALUE) {
    const query = { ...route.query };
    delete query.session;
    void router.replace({ path: '/login', query });
  }
};

onMounted(syncSessionExpiredNotice);
watch(() => route.fullPath, syncSessionExpiredNotice);

const activeComponent = computed(() => {
  if (authView.value === 'signup') {
    return SignUpPage;
  }
  if (authView.value === 'verify-email') {
    return VerifyEmailPage;
  }
  if (authView.value === 'forgot-password') {
    return ForgotPasswordPage;
  }
  if (authView.value === 'reset-password-code') {
    return ResetPasswordCodePage;
  }
  if (authView.value === 'reset-password') {
    return ResetPasswordPage;
  }
  return LoginPage;
});

const title = computed(() => {
  if (authView.value === 'signup') {
    return t('auth.signUpTitle');
  }
  if (authView.value === 'verify-email') {
    return t('auth.verifyTitle');
  }
  if (authView.value === 'forgot-password') {
    return t('auth.forgotPasswordTitle');
  }
  if (authView.value === 'reset-password-code') {
    return t('auth.resetCodeTitle');
  }
  if (authView.value === 'reset-password') {
    return t('auth.resetPasswordTitle');
  }
  return t('auth.loginTitle');
});

const subtitle = computed(() => {
  if (authView.value === 'signup') {
    return t('auth.signUpSubtitle');
  }
  if (authView.value === 'verify-email') {
    return t('auth.verifySubtitle');
  }
  if (authView.value === 'forgot-password') {
    return t('auth.forgotPasswordSubtitle');
  }
  if (authView.value === 'reset-password-code') {
    return t('auth.resetCodeSubtitle');
  }
  if (authView.value === 'reset-password') {
    return t('auth.resetPasswordSubtitle');
  }
  return t('auth.loginSubtitle');
});
</script>
