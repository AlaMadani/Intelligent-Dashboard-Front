<template>
  <!-- Route wrapper: display the shared session dataset inside the session table section. -->
  <q-page class="neo-page">
    <SessionsSection
      :sessions="sessions"
      :loading="analyticsLoading"
      :error="analyticsError"
      :search="sessionSearch"
      @update:search="(value) => (sessionSearch = value)"
    />
  </q-page>
</template>

<script setup lang="ts">
// Consume session-table state from the shared dashboard store.
import SessionsSection from 'src/components/dashboard/SessionsSection.vue';
import { useDashboard } from 'src/composables/useDashboard';

const { sessions, analyticsLoading, analyticsError, sessionSearch } = useDashboard();
</script>
