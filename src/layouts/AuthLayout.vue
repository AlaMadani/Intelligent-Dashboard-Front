// ---- Template ----
<template>
  <auth-shell :title="title" :subtitle="subtitle">
    <component :is="activeComponent" :key="authView" />
  </auth-shell>
</template>

// ---- Script Setup ----
<script setup lang="ts">
// ---- Imports ----
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import AuthShell from 'src/components/auth/AuthShell.vue';
import LoginPage from 'src/pages/LoginPage.vue';
import SignUpPage from 'src/pages/SignUpPage.vue';
import VerifyEmailPage from 'src/pages/VerifyEmailPage.vue';
import ForgotPasswordPage from 'src/pages/ForgotPasswordPage.vue';
import ResetPasswordCodePage from 'src/pages/ResetPasswordCodePage.vue';
import ResetPasswordPage from 'src/pages/ResetPasswordPage.vue';

// ---- Composables ----
const route = useRoute();
const { t } = useI18n();

// ---- Computed Properties ----
const authView = computed(() => {
  if (typeof route.meta.authView === 'string') {
    return route.meta.authView;
  }

  const paramAuthView = route.params.authView;
  if (Array.isArray(paramAuthView)) {
    return paramAuthView[0] ?? 'login';
  }

  return typeof paramAuthView === 'string' ? paramAuthView : 'login';
});

const authViewConfig = computed(() => {
  switch (authView.value) {
    case 'signup':
      return {
        component: SignUpPage,
        titleKey: 'auth.signUpTitle',
        subtitleKey: 'auth.signUpSubtitle',
      };
    case 'verify-email':
      return {
        component: VerifyEmailPage,
        titleKey: 'auth.verifyTitle',
        subtitleKey: 'auth.verifySubtitle',
      };
    case 'forgot-password':
      return {
        component: ForgotPasswordPage,
        titleKey: 'auth.forgotPasswordTitle',
        subtitleKey: 'auth.forgotPasswordSubtitle',
      };
    case 'reset-password-code':
      return {
        component: ResetPasswordCodePage,
        titleKey: 'auth.resetCodeTitle',
        subtitleKey: 'auth.resetCodeSubtitle',
      };
    case 'reset-password':
      return {
        component: ResetPasswordPage,
        titleKey: 'auth.resetPasswordTitle',
        subtitleKey: 'auth.resetPasswordSubtitle',
      };
    default:
      return {
        component: LoginPage,
        titleKey: 'auth.loginTitle',
        subtitleKey: 'auth.loginSubtitle',
      };
  }
});

const activeComponent = computed(() => authViewConfig.value.component);
const title = computed(() => t(authViewConfig.value.titleKey));
const subtitle = computed(() => t(authViewConfig.value.subtitleKey));
</script>
