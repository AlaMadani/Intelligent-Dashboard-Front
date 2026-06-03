import { computed, onMounted, ref, shallowRef } from 'vue';
import { getV36ForecastDashboard, normalizeApiError } from 'src/services/analytics';
import type { V36ForecastDashboardResponse } from 'src/types/analytics';
import { safeArray } from 'src/utils/format';
import { useV36SseRefresh } from './useV36SseRefresh';

export const useForecastDashboard = () => {
  const data = shallowRef<V36ForecastDashboardResponse | null>(null);
  const loading = ref(false);
  const error = ref('');
  const lastUpdated = ref<Date | null>(null);

  const source = computed(() => data.value?.source ?? '');
  const warnings = computed(() => [
    ...safeArray<string>(data.value?.warnings),
    ...safeArray<string>(data.value?.forecastWarnings),
  ]);

  const refresh = async () => {
    loading.value = true;
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

  onMounted(() => {
    void refresh();
  });

  useV36SseRefresh(['forecast'], () => {
    void refresh();
  });

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
