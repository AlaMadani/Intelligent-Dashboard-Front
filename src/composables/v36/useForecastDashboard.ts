import { computed, onMounted, ref, shallowRef } from 'vue';
import { getV36ForecastDashboard, normalizeApiError } from 'src/services/analytics';
import type { V36ForecastDashboardResponse } from 'src/types/analytics';
import { safeArray } from 'src/utils/format';
import { throttle } from 'src/utils/throttle';
import { useV36SseRefresh } from './useV36SseRefresh';

export const useForecastDashboard = () => {
  // ---- State ----
  const data = shallowRef<V36ForecastDashboardResponse | null>(null);
  const loading = ref(false);
  const error = ref('');
  const lastUpdated = ref<Date | null>(null);

  // ---- Computed ----
  const source = computed(() => data.value?.source ?? '');
  const warnings = computed(() => [
    ...safeArray<string>(data.value?.warnings),
    ...safeArray<string>(data.value?.forecastWarnings),
  ]);

  // ---- Methods ----
  const refresh = async (silent = false) => {
    if (!silent) loading.value = true;
    error.value = '';

    try {
      const response = await getV36ForecastDashboard();
      data.value = response.data ?? null;
      lastUpdated.value = new Date();
    } catch (err) {
      error.value = normalizeApiError(err).message;
    } finally {
      loading.value = false;
    }
  };

  // ---- Lifecycle ----
  onMounted(() => {
    void refresh();
  });

  // ---- SSE Refresh ----
  const throttledRefresh = throttle(() => { void refresh(true); }, 10000);
  useV36SseRefresh(['forecast'], () => {
    throttledRefresh();
  });

  // ---- Return ----
  return {
    data,
    loading,
    error,
    refresh,
    lastUpdated,
    source,
    warnings,
  };
};
