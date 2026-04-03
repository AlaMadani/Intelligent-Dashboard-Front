<template>
  <!-- Default landing route delegates directly to the overview experience. -->
  <OverviewPage />
</template>

<script setup lang="ts">
// Re-export the overview page so the root path and /overview stay aligned.
import OverviewPage from './OverviewPage.vue';
</script>
