<template>
  <div class="brand-logo" :class="`brand-logo--${variant}`">
    <span class="brand-logo__frame">
      <img class="brand-logo__image" :src="logoUrl" alt="NoveoCare" />
    </span>
    <span v-if="showProduct" class="brand-logo__product">Insights</span>
  </div>
</template>

<script setup lang="ts">
import logoUrl from 'src/assets/logo_noveocare.jpg';

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
  border-radius: 8px;
  background: #ffffff;
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
  box-shadow: 0 14px 30px rgba(6, 14, 18, 0.14);
}

.brand-logo--auth .brand-logo__product {
  color: #f6fbf9;
  font-size: 16px;
}

.brand-logo--drawer {
  display: flex;
  justify-content: flex-start;
}

.brand-logo--drawer .brand-logo__frame {
  width: 144px;
  height: 56px;
  box-shadow: 0 12px 24px rgba(6, 14, 18, 0.16);
}

.brand-logo--drawer .brand-logo__product {
  color: #f6fbf9;
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
