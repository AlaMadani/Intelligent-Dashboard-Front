import { computed, onMounted, ref, shallowRef } from 'vue';
import {
  getV36CriticalAlerts,
  getV36Diagnostics,
  getV36RuntimeHealth,
  getV36SecurityOverview,
  normalizeApiError,
} from 'src/services/analytics';
import type {
  V36DiagnosticsResponse,
  V36LiveAlertItem,
  V36RuntimeHealthResponse,
  V36SecurityOverviewResponse,
} from 'src/types/analytics';
import { safeArray } from 'src/utils/format';
import { throttle } from 'src/utils/throttle';
import { useV36SseRefresh } from './useV36SseRefresh';

export const useSecurityOverview = () => {
  const data = shallowRef<V36SecurityOverviewResponse | null>(null);
  const diagnostics = shallowRef<V36DiagnosticsResponse | null>(null);
  const runtimeHealth = shallowRef<V36RuntimeHealthResponse | null>(null);
  const criticalAlerts = shallowRef<V36LiveAlertItem[]>([]);
  const loading = ref(false);
  const error = ref('');
  const lastUpdated = ref<Date | null>(null);

  const source = computed(() => data.value?.source ?? '');
  const warnings = computed(() => [
    ...new Set([
      ...safeArray<string>(data.value?.warnings),
      ...safeArray<string>(data.value?.fieldCoverageWarnings),
      ...safeArray<string>(diagnostics.value?.warnings),
      ...safeArray<string>(runtimeHealth.value?.warnings),
    ]),
  ]);

  const refreshCriticalAlerts = async () => {
    const response = await getV36CriticalAlerts({ limit: 5, offset: 0 });
    criticalAlerts.value = response.data.items ?? [];
  };

  const refresh = async (silent = false) => {
    if (!silent) loading.value = true;
    error.value = '';

    try {
      const [overviewResponse, diagnosticsResponse, runtimeResponse] = await Promise.all([
        getV36SecurityOverview(),
        getV36Diagnostics(),
        getV36RuntimeHealth(),
      ]);

      data.value = overviewResponse.data ?? null;
      diagnostics.value = diagnosticsResponse.data ?? null;
      runtimeHealth.value = runtimeResponse.data ?? null;
      await refreshCriticalAlerts().catch(() => {
        criticalAlerts.value = [];
      });
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

  const throttledRefresh = throttle(() => { void refresh(true); }, 5000);
  useV36SseRefresh(['security-overview', 'runtime-health'], () => {
    throttledRefresh();
  });

  return {
    data,
    diagnostics,
    runtimeHealth,
    criticalAlerts,
    loading,
    error,
    refresh,
    lastUpdated,
    source,
    warnings,
  };
};
