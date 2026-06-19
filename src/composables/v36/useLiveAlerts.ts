import { computed, onMounted, ref, shallowRef } from 'vue';
import {
  getV36CriticalAlerts,
  getV36LiveAlerts,
  normalizeApiError,
} from 'src/services/analytics';
import type {
  V36AlertListParams,
  V36LiveAlertItem,
  V36LiveAlertsResponse,
} from 'src/types/analytics';
import { safeArray } from 'src/utils/format';
import { throttle } from 'src/utils/throttle';
import { useV36SseRefresh } from './useV36SseRefresh';

export const useLiveAlerts = () => {
  const data = shallowRef<V36LiveAlertsResponse | null>(null);
  const criticalData = shallowRef<V36LiveAlertsResponse | null>(null);
  const params = ref<V36AlertListParams>({ limit: 50, offset: 0 });
  const loading = ref(false);
  const error = ref('');
  const lastUpdated = ref<Date | null>(null);

  const items = computed<V36LiveAlertItem[]>(() => data.value?.items ?? []);
  const criticalItems = computed<V36LiveAlertItem[]>(() => criticalData.value?.items ?? []);
  const source = computed(() => data.value?.source ?? '');
  const warnings = computed(() => [
    ...safeArray<string>(data.value?.warnings),
    ...items.value.flatMap((item) => safeArray<string>(item.warnings)),
  ]);
  const count = computed(() => data.value?.count ?? items.value.length);
  const hasMore = computed(() => Boolean(data.value?.hasMore));

  const refresh = async (silent = false) => {
    if (!silent) loading.value = true;
    error.value = '';

    try {
      const [liveResponse, criticalResponse] = await Promise.all([
        getV36LiveAlerts(params.value),
        getV36CriticalAlerts({ limit: 20, offset: 0 }),
      ]);

      data.value = liveResponse.data ?? null;
      criticalData.value = criticalResponse.data ?? null;
      lastUpdated.value = new Date();
    } catch (err) {
      error.value = normalizeApiError(err).message;
    } finally {
      loading.value = false;
    }
  };

  const nextPage = () => {
    if (!hasMore.value) return;
    const limit = params.value.limit ?? 50;
    params.value = {
      ...params.value,
      offset: (params.value.offset ?? 0) + limit,
    };
    void refresh();
  };

  const previousPage = () => {
    const limit = params.value.limit ?? 50;
    params.value = {
      ...params.value,
      offset: Math.max(0, (params.value.offset ?? 0) - limit),
    };
    void refresh();
  };

  onMounted(() => {
    void refresh();
  });

  const throttledRefresh = throttle(() => { void refresh(true); }, 2000);
  useV36SseRefresh(['alerts'], () => {
    throttledRefresh();
  });

  return {
    data,
    criticalData,
    params,
    items,
    criticalItems,
    loading,
    error,
    refresh,
    nextPage,
    previousPage,
    lastUpdated,
    source,
    warnings,
    count,
    hasMore,
  };
};
