<template>
  <div class="auth-page">
    <div class="auth-page__controls">
      <theme-toggle />
    </div>

    <div class="auth-shell">
      <aside class="auth-brand-panel" :style="brandPanelStyle">
        <div class="auth-panel-copy">
          <div class="auth-kicker">{{ t('layout.drawerKicker') }}</div>
          <h2>{{ t('layout.subtitle') }}</h2>
          <p>{{ t('layout.drawerCopy') }}</p>
        </div>

      </aside>

      <main class="auth-form-panel">
        <section class="auth-card neo-loading-scope">
          <loading-overlay :show="authStore.isLoading" context="auth" placement="panel" />
          <div class="auth-card-fixed">
            <brand-logo variant="card" :show-product="false" />

            <div class="auth-header">
              <Transition name="auth-copy" mode="out-in">
                <div :key="title">
                  <h1>{{ title }}</h1>
                  <p>{{ subtitle }}</p>
                </div>
              </Transition>
            </div>
          </div>

          <Transition name="auth-notice">
            <q-banner v-if="notice" dense rounded class="auth-session-notice">
              <template #avatar>
                <q-icon name="schedule" />
              </template>

              {{ notice }}

              <template #action>
                <q-btn
                  flat
                  dense
                  round
                  icon="close"
                  :aria-label="t('auth.dismissSessionNotice')"
                  @click="$emit('dismiss-notice')"
                />
              </template>
            </q-banner>
          </Transition>

          <Transition name="auth-panel" mode="out-in">
            <div :key="title" class="auth-content-frame">
              <slot />
            </div>
          </Transition>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import BrandLogo from 'src/components/brand/BrandLogo.vue';
import ThemeToggle from 'src/components/theme/ThemeToggle.vue';
import LoadingOverlay from 'src/components/loading/LoadingOverlay.vue';
import { environment } from 'src/config/environment';
import { useAuthStore } from 'src/stores/auth';

defineProps<{
  title: string;
  subtitle: string;
  notice?: string;
}>();

defineEmits<{
  (event: 'dismiss-notice'): void;
}>();

const { t } = useI18n();
const authStore = useAuthStore();

const brandPanelStyle = computed(() =>
  environment.authPanelImageUrl
    ? { '--auth-panel-image': `url("${environment.authPanelImageUrl}")` }
    : {},
);
</script>

<style scoped>
.auth-page {
  position: relative;
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: clamp(18px, 3vw, 34px);
  background:
    radial-gradient(circle at 16% 10%, var(--neo-bg-coral-glow), transparent 34%),
    radial-gradient(circle at 86% 6%, var(--neo-bg-amber-glow), transparent 32%),
    linear-gradient(180deg, var(--neo-body-bg-start) 0%, var(--neo-page-bg) 100%);
}

.auth-page__controls {
  position: fixed;
  top: clamp(18px, 3vw, 34px);
  right: clamp(18px, 3vw, 34px);
  z-index: 20;
}

.auth-shell {
  width: min(100%, 1100px);
  min-height: min(740px, calc(100vh - 68px));
  display: grid;
  grid-template-columns: minmax(320px, 0.9fr) minmax(360px, 1fr);
  overflow: hidden;
  border: var(--neo-border);
  border-radius: 24px;
  background: var(--neo-card-bg);
  box-shadow: var(--neo-shadow-hover);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.auth-brand-panel {
  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: clamp(28px, 4vw, 46px);
  color: #fff7f7;
  background:
    linear-gradient(180deg, rgba(20, 16, 16, 0.1) 0%, rgba(20, 16, 16, 0.86) 100%),
    linear-gradient(145deg, rgba(229, 77, 86, 0.36), rgba(74, 65, 63, 0.64)),
    var(--auth-panel-image, linear-gradient(135deg, #4a413f 0%, #1e1918 52%, #141010 100%));
  background-size: cover;
  background-position: center;
}

.auth-brand-panel::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    linear-gradient(90deg, rgba(0, 0, 0, 0.18), transparent 42%),
    linear-gradient(0deg, rgba(0, 0, 0, 0.44), transparent 48%);
}

.auth-panel-copy {
  max-width: 430px;
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.35);
}

.auth-kicker {
  color: rgba(255, 247, 247, 0.62);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.auth-panel-copy h2 {
  margin: 14px 0 0;
  color: #ffffff;
  font-size: 32px;
  font-weight: 800;
  line-height: 1.08;
}

.auth-panel-copy p {
  margin: 16px 0 0;
  color: rgba(255, 247, 247, 0.84);
  font-size: 14px;
  line-height: 1.6;
}

.auth-form-panel {
  display: grid;
  place-items: stretch center;
  padding: clamp(24px, 4vw, 48px);
  background:
    linear-gradient(145deg, rgba(229, 77, 86, 0.08), transparent 34%),
    var(--neo-card-bg-solid);
}

.auth-card {
  width: min(100%, 430px);
  min-height: 630px;
  padding: 0;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  border-radius: 18px;
  overflow: hidden;
}

.auth-card-fixed {
  display: grid;
  justify-items: center;
  align-content: start;
}

.auth-header {
  width: 100%;
  min-height: 100px;
  margin: 24px 0 10px;
  text-align: center;
  display: grid;
  align-items: start;
}

.auth-header h1 {
  margin: 0;
  color: var(--neo-ink);
  font-family: 'Outfit', 'Inter', sans-serif;
  font-size: 31px;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.15;
}

.auth-header p {
  margin: 8px 0 0;
  color: var(--neo-ink-muted);
  font-size: 14px;
  line-height: 1.5;
}

.auth-content-frame {
  min-height: 360px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.auth-session-notice {
  margin: 0 0 18px;
  border: 1px solid rgba(229, 77, 86, 0.28);
  color: var(--neo-ink);
  background: rgba(229, 77, 86, 0.12);
  font-size: 13px;
  line-height: 1.45;
}

.auth-session-notice :deep(.q-icon) {
  color: var(--neo-accent);
}

.auth-copy-enter-active,
.auth-copy-leave-active,
.auth-panel-enter-active,
.auth-panel-leave-active,
.auth-notice-enter-active,
.auth-notice-leave-active {
  transition:
    opacity 180ms ease,
    transform 220ms cubic-bezier(0.2, 0, 0, 1);
}

.auth-copy-enter-from,
.auth-copy-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

.auth-panel-enter-from,
.auth-panel-leave-to,
.auth-notice-enter-from,
.auth-notice-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@media (max-width: 900px) {
  .auth-page {
    align-items: start;
  }

  .auth-shell {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .auth-brand-panel {
    display: none;
  }

  .auth-card {
    min-height: min(640px, calc(100vh - 68px));
  }
}

@media (max-width: 560px) {
  .auth-page {
    padding: 0;
  }

  .auth-page__controls {
    top: 16px;
    right: 16px;
  }

  .auth-shell {
    min-height: 100vh;
    border: 0;
    border-radius: 0;
  }

  .auth-form-panel {
    padding: 26px 20px 34px;
  }

  .auth-card {
    min-height: 100vh;
  }

  .auth-content-frame {
    min-height: 350px;
  }

  .auth-header h1 {
    font-size: 25px;
  }
}
</style>
