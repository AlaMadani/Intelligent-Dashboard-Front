import { computed, onMounted, ref, shallowRef } from 'vue';
import {
  getV36ChurnDashboard,
  getV36ChurnUsers,
  normalizeApiError,
} from 'src/services/analytics';
import type {
  V36ChurnDashboardResponse,
  V36ChurnUsersParams,
  V36ChurnUsersResponse,
} from 'src/types/analytics';
import { safeArray } from 'src/utils/format';
import { useV36SseRefresh } from './useV36SseRefresh';

export const useChurnDashboard = () => {
  const data = shallowRef<V36ChurnDashboardResponse | null>(null);
  const users = shallowRef<V36ChurnUsersResponse | null>(null);
  const params = ref<V36ChurnUsersParams>({ limit: 50, offset: 0 });
  const loading = ref(false);
  const error = ref('');
  const lastUpdated = ref<Date | null>(null);

  const userItems = computed(() => users.value?.items ?? data.value?.topChurnRiskUsers ?? []);
  const source = computed(() => data.value?.source ?? users.value?.source ?? '');
  const warnings = computed(() => [
    ...safeArray<string>(data.value?.warnings),
    ...safeArray<string>(users.value?.warnings),
  ]);

  const refresh = async () => {
    loading.value = true;
    error.value = '';

    try {
      const [dashboardResponse, usersResponse] = await Promise.all([
        getV36ChurnDashboard(),
        getV36ChurnUsers(params.value),
      ]);
      data.value = dashboardResponse.data ?? null;
      users.value = usersResponse.data ?? null;
      lastUpdated.value = new Date();
    } catch (err) {
      error.value = normalizeApiError(err).message;
    } finally {
      loading.value = false;
    }
  };

  onMounted(() => {
    void refresh();
  });

  useV36SseRefresh(['churn'], () => {
    void refresh();
  });

  return {
    data,
    users,
    userItems,
    params,
    loading,
    error,
    refresh,
    lastUpdated,
    source,
    warnings,
  };
};
