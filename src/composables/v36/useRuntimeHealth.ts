import { computed, onMounted, ref, shallowRef } from 'vue';
import {
  getV36Diagnostics,
  getV36FinalWinners,
  getV36Reports,
  getV36RuntimeHealth,
  normalizeApiError,
} from 'src/services/analytics';
import type {
  V36DiagnosticsResponse,
  V36FinalWinnersResponse,
  V36ReportMetadataResponse,
  V36RuntimeHealthResponse,
} from 'src/types/analytics';
import { safeArray } from 'src/utils/format';
import { useV36SseRefresh } from './useV36SseRefresh';

export const useRuntimeHealth = () => {
  const runtimeHealth = shallowRef<V36RuntimeHealthResponse | null>(null);
  const diagnostics = shallowRef<V36DiagnosticsResponse | null>(null);
  const finalWinners = shallowRef<V36FinalWinnersResponse | null>(null);
  const reports = shallowRef<V36ReportMetadataResponse | null>(null);
  const loading = ref(false);
  const error = ref('');
  const lastUpdated = ref<Date | null>(null);

  const source = computed(() => runtimeHealth.value?.source ?? diagnostics.value?.source ?? '');
  const warnings = computed(() => [
    ...safeArray<string>(runtimeHealth.value?.warnings),
    ...safeArray<string>(diagnostics.value?.warnings),
    ...safeArray<string>(finalWinners.value?.warnings),
    ...safeArray<string>(reports.value?.warnings),
  ]);

  const refresh = async () => {
    loading.value = true;
    error.value = '';

    try {
      const [runtimeResponse, diagnosticsResponse, winnersResponse, reportsResponse] =
        await Promise.all([
          getV36RuntimeHealth(),
          getV36Diagnostics(),
          getV36FinalWinners().catch(() => null),
          getV36Reports().catch(() => null),
        ]);

      runtimeHealth.value = runtimeResponse.data ?? null;
      diagnostics.value = diagnosticsResponse.data ?? null;
      finalWinners.value = winnersResponse?.data ?? null;
      reports.value = reportsResponse?.data ?? null;
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

  useV36SseRefresh(['runtime-health'], () => {
    void refresh();
  });

  return {
    runtimeHealth,
    diagnostics,
    finalWinners,
    reports,
    loading,
    error,
    refresh,
    lastUpdated,
    source,
    warnings,
  };
};
