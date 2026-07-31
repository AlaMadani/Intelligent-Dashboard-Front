<template>
  <div class="brand-logo" :class="`brand-logo--${variant}`">
    <span class="brand-logo__frame">
      <img class="brand-logo__image" :src="logoUrl" :alt="t('brand.alt')" />
    </span>
    <span v-if="showProduct" class="brand-logo__product">{{ t('brand.product') }}</span>
  </div>
</template>

<script setup lang="ts">
// ---- Imports ----
import { useI18n } from 'vue-i18n';
import logoUrl from 'src/assets/logo_noveocare.png';

const { t } = useI18n();

// ---- Props ----
withDefaults(
  defineProps<{
    variant?: 'auth' | 'card' | 'drawer' | 'header';
    showProduct?: boolean;
  }>(),
  {
    variant: 'header',
    showProduct: true,
  },
);
</script>

// ---- Styles ----
<style scoped>
.brand-logo {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  gap: 10px;
}

.brand-logo__frame {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex: 0 0 auto;
  /* Removed background: #ffffff; here */
}

.brand-logo__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.brand-logo__product {
  color: var(--neo-ink);
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
  white-space: nowrap;
}

.brand-logo--header .brand-logo__frame {
  width: 112px;
  height: 42px;
}

.brand-logo--card .brand-logo__frame {
  width: 152px;
  height: 60px;
  margin-inline: auto;
}

.brand-logo--auth {
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.brand-logo--auth .brand-logo__frame {
  width: 188px;
  height: 74px;
  box-shadow: 0 18px 34px rgba(0, 0, 0, 0.28);
}

.brand-logo--auth .brand-logo__product {
  color: var(--neo-drawer-text);
  font-size: 16px;
}

.brand-logo--drawer {
  display: flex;
  justify-content: flex-start;
}

.brand-logo--drawer .brand-logo__frame {
  width: 144px;
  height: 56px;
  box-shadow: 0 16px 30px rgba(0, 0, 0, 0.24);
}

.brand-logo--drawer .brand-logo__product {
  color: var(--neo-drawer-text);
}

@media (max-width: 520px) {
  .brand-logo--header .brand-logo__frame {
    width: 96px;
    height: 36px;
  }

  .brand-logo--header .brand-logo__product {
    display: none;
  }
}
</style>
