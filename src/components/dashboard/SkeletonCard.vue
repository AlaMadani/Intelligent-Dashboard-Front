<template>
  <!-- Placeholder card shown while live KPI data is still loading. -->
  <q-card class="neo-card neo-skeleton-card no-shadow">
    <q-card-section>
      <div class="row justify-between items-center q-mb-md">
        <div class="neo-shimmer" style="width: 40px; height: 40px; border-radius: 8px"></div>
        <div class="neo-shimmer" style="width: 24px; height: 24px; border-radius: 50%"></div>
      </div>
      <div>
        <div class="neo-shimmer q-mb-sm" style="width: 60%; height: 28px; border-radius: 4px"></div>
        <div class="neo-shimmer" style="width: 40%; height: 16px; border-radius: 4px"></div>
      </div>
    </q-card-section>
  </q-card>
</template>

// ---- Styles ----
<style scoped>
/* Skeleton dimensions and shimmer effect used by the KPI strip. */
.neo-skeleton-card {
  min-height: 140px;
}
.neo-shimmer {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.04) 25%,
    rgba(229, 77, 86, 0.12) 50%,
    rgba(255, 255, 255, 0.04) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
</style>
