// ---- Template ----
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
        <div id="account-summary-section" class="neo-account-panel"
          data-assistant-id="account-summary-section"
          data-assistant-type="section"
          data-assistant-label="Account Summary Section"
          data-assistant-description="Section showing the profile summary including full name, email, and role."
          data-assistant-actions="HIGHLIGHT_ELEMENT"
        >
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

        <div id="account-password-section" class="neo-account-panel neo-loading-scope"
          data-assistant-id="account-password-section"
          data-assistant-type="section"
          data-assistant-label="Password Section"
          data-assistant-description="Section containing the change password form with current password, new password, and confirm password fields."
          data-assistant-actions="HIGHLIGHT_ELEMENT"
        >
          <loading-overlay :show="authStore.isLoading" context="auth" placement="panel" />
          <div class="neo-panel-title">{{ t('auth.changePasswordTitle') }}</div>
          <q-form class="neo-account-form" @submit="handleChangePassword">
            <q-input
              id="account-current-password-input"
              v-model="formData.currentPassword"
              :label="t('auth.currentPassword')"
              :type="showCurrent ? 'text' : 'password'"
              autocomplete="current-password"
              outlined
              dense
              class="auth-field"
              :rules="[val => val && val.length > 0 || t('auth.currentPasswordRequired')]"
              data-assistant-id="account-current-password-input"
              data-assistant-type="input"
              data-assistant-label="Current Password Input"
              data-assistant-description="Text input field for entering the current password."
              data-assistant-actions="HIGHLIGHT_ELEMENT,SET_FILTER"
            >
              <template #prepend>
                <q-icon name="lock" />
              </template>
              <template #append>
                <q-btn
                  flat
                  dense
                  round
                  :icon="showCurrent ? 'visibility_off' : 'visibility'"
                  :aria-label="t('auth.togglePasswordVisibility')"
                  @click.stop.prevent="showCurrent = !showCurrent"
                />
              </template>
            </q-input>

            <q-input
              id="account-new-password-input"
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
              data-assistant-id="account-new-password-input"
              data-assistant-type="input"
              data-assistant-label="New Password Input"
              data-assistant-description="Text input field for entering the new password."
              data-assistant-actions="HIGHLIGHT_ELEMENT,SET_FILTER"
            >
              <template #prepend>
                <q-icon name="vpn_key" />
              </template>
              <template #append>
                <q-btn
                  flat
                  dense
                  round
                  :icon="showNew ? 'visibility_off' : 'visibility'"
                  :aria-label="t('auth.togglePasswordVisibility')"
                  @click.stop.prevent="showNew = !showNew"
                />
              </template>
            </q-input>

            <q-input
              id="account-confirm-password-input"
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
              data-assistant-id="account-confirm-password-input"
              data-assistant-type="input"
              data-assistant-label="Confirm Password Input"
              data-assistant-description="Text input field for confirming the new password."
              data-assistant-actions="HIGHLIGHT_ELEMENT,SET_FILTER"
            >
              <template #prepend>
                <q-icon name="verified_user" />
              </template>
              <template #append>
                <q-btn
                  flat
                  dense
                  round
                  :icon="showConfirm ? 'visibility_off' : 'visibility'"
                  :aria-label="t('auth.togglePasswordVisibility')"
                  @click.stop.prevent="showConfirm = !showConfirm"
                />
              </template>
            </q-input>

            <div v-if="notice" class="auth-notice">
              {{ notice }}
            </div>

            <div v-if="authStore.error" class="auth-error">
              {{ authStore.error }}
            </div>

            <q-btn
              id="account-change-password-button"
              type="submit"
              color="primary"
              icon="save"
              :label="t('auth.changePassword')"
              data-assistant-id="account-change-password-button"
              data-assistant-type="button"
              data-assistant-label="Change Password Button"
              data-assistant-description="Button that submits the password change form."
              data-assistant-actions="HIGHLIGHT_ELEMENT,CLICK_ELEMENT"
              :disable="authStore.isLoading"
              unelevated
              class="neo-account-submit"
            />
          </q-form>
        </div>
      </div>
    </section>
  </q-page>
</template>

// ---- Script Setup ----
<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import LoadingOverlay from 'src/components/loading/LoadingOverlay.vue';
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
