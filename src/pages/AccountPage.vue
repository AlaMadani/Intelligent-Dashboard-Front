<template>
  <q-page class="neo-page">
    <section class="neo-section">
      <div class="neo-section-header">
        <div>
          <div class="neo-section-title">{{ t('auth.accountSettings') }}</div>
          <div class="neo-section-subtitle">{{ t('auth.accountSettingsSubtitle') }}</div>
        </div>
      </div>

      <div class="neo-account-grid">
        <div class="neo-account-panel">
          <div class="neo-panel-title">{{ t('auth.profileSummary') }}</div>
          <div class="neo-account-summary">
            <div>
              <span>{{ t('auth.fullName') }}</span>
              <strong>{{ authStore.user?.fullName }}</strong>
            </div>
            <div>
              <span>{{ t('auth.email') }}</span>
              <strong>{{ authStore.user?.email }}</strong>
            </div>
            <div>
              <span>{{ t('auth.role') }}</span>
              <strong>{{ authStore.user?.role }}</strong>
            </div>
          </div>
        </div>

        <div class="neo-account-panel">
          <div class="neo-panel-title">{{ t('auth.changePasswordTitle') }}</div>
          <q-form class="neo-account-form" @submit="handleChangePassword">
            <q-input
              v-model="formData.currentPassword"
              :label="t('auth.currentPassword')"
              :type="showCurrent ? 'text' : 'password'"
              autocomplete="current-password"
              outlined
              dense
              class="auth-field"
              :rules="[val => val && val.length > 0 || t('auth.currentPasswordRequired')]"
            >
              <template #prepend>
                <q-icon name="lock" />
              </template>
              <template #append>
                <q-btn flat dense round :icon="showCurrent ? 'visibility_off' : 'visibility'" @click.stop.prevent="showCurrent = !showCurrent" />
              </template>
            </q-input>

            <q-input
              v-model="formData.newPassword"
              :label="t('auth.newPassword')"
              :type="showNew ? 'text' : 'password'"
              autocomplete="new-password"
              outlined
              dense
              class="auth-field"
              :rules="[
                val => val && val.length > 0 || t('auth.passwordRequired'),
                val => val && val.length >= 8 || t('auth.passwordTooShort'),
              ]"
            >
              <template #prepend>
                <q-icon name="vpn_key" />
              </template>
              <template #append>
                <q-btn flat dense round :icon="showNew ? 'visibility_off' : 'visibility'" @click.stop.prevent="showNew = !showNew" />
              </template>
            </q-input>

            <q-input
              v-model="formData.passwordConfirm"
              :label="t('auth.confirmNewPassword')"
              :type="showConfirm ? 'text' : 'password'"
              autocomplete="new-password"
              outlined
              dense
              class="auth-field"
              :rules="[
                val => val && val.length > 0 || t('auth.confirmPasswordRequired'),
                val => val === formData.newPassword || t('auth.passwordMismatch'),
              ]"
            >
              <template #prepend>
                <q-icon name="verified_user" />
              </template>
              <template #append>
                <q-btn flat dense round :icon="showConfirm ? 'visibility_off' : 'visibility'" @click.stop.prevent="showConfirm = !showConfirm" />
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
              color="primary"
              icon="save"
              :label="t('auth.changePassword')"
              :loading="authStore.isLoading"
              unelevated
              class="neo-account-submit"
            />
          </q-form>
        </div>
      </div>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from 'src/stores/auth';

const { t } = useI18n();
const authStore = useAuthStore();

const formData = reactive({
  currentPassword: '',
  newPassword: '',
  passwordConfirm: '',
});

const showCurrent = ref(false);
const showNew = ref(false);
const showConfirm = ref(false);
const notice = ref<string | null>(null);

const handleChangePassword = async () => {
  authStore.clearError();
  notice.value = null;

  const response = await authStore.changePassword(formData);
  if (response.success) {
    notice.value = response.message || t('auth.passwordChanged');
    formData.currentPassword = '';
    formData.newPassword = '';
    formData.passwordConfirm = '';
  }
};
</script>
