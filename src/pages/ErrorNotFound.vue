// ---- Template ----
<template>
  <!-- Static fallback shown when no configured route matches the current URL. -->
  <div class="error-page fullscreen text-center q-pa-md flex flex-center">
    <div class="error-card">
      <div class="error-code">404</div>

      <div class="error-title">{{ t('errorNotFound.title') }}</div>

      <q-btn
        class="q-mt-xl"
        color="primary"
        unelevated
        :to="{ name: ROUTE_NAMES.SECURITY_OVERVIEW }"
        :label="t('errorNotFound.goHome')"
        no-caps
      />
    </div>
  </div>
</template>

// ---- Script Setup ----
<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { ROUTE_NAMES } from 'src/router/route-names';

const { t } = useI18n();
</script>

// ---- Styles ----
<style scoped>
.error-page {
  color: var(--neo-ink);
  background:
    radial-gradient(circle at 18% 10%, var(--neo-bg-coral-glow), transparent 30%),
    radial-gradient(circle at 80% 22%, var(--neo-bg-amber-glow), transparent 30%),
    linear-gradient(180deg, var(--neo-body-bg-start) 0%, var(--neo-page-bg) 100%);
}

.error-card {
  width: min(100%, 620px);
  padding: clamp(28px, 6vw, 58px);
  border: var(--neo-border);
  border-radius: 28px;
  background: var(--neo-card-bg);
  box-shadow: var(--neo-shadow-hover);
}

.error-code {
  color: var(--neo-accent);
  font-family: 'Outfit', 'Inter', sans-serif;
  font-size: clamp(92px, 24vw, 220px);
  font-weight: 800;
  letter-spacing: -0.08em;
  line-height: 0.86;
  text-shadow: 0 16px 44px rgba(229, 77, 86, 0.22);
}

.error-title {
  margin-top: 24px;
  color: var(--neo-ink-muted);
  font-family: 'Outfit', 'Inter', sans-serif;
  font-size: clamp(28px, 6vw, 54px);
  font-weight: 700;
  line-height: 1;
}
</style>
