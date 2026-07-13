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

  const items = computed<V36LiveAlertItem[]>(() => {
    const list = data.value?.items ?? [];
    return [...list].sort((a, b) => {
      const aTs = a.timestamp ?? a.createdAt ?? '';
      const bTs = b.timestamp ?? b.createdAt ?? '';
      return bTs.localeCompare(aTs);
    });
  });

  const criticalItems = computed<V36LiveAlertItem[]>(() => criticalData.value?.items ?? []);
  const source = computed(() => data.value?.source ?? '');
  const warnings = computed(() => [
    ...new Set([
      ...safeArray<string>(data.value?.warnings),
      ...items.value.flatMap((item) => safeArray<string>(item.warnings)),
    ]),
  ]);
  const count = computed(() => data.value?.count ?? items.value.length);
  const hasMore = computed(() => Boolean(data.value?.hasMore));
  const limit = computed(() => params.value.limit ?? 50);
  const currentOffset = computed(() => params.value.offset ?? 0);

  const totalPages = computed(() => {
    const c = count.value;
    const l = limit.value;
    if (c == null || l <= 0) return 0;
    return Math.ceil(c / l);
  });

  const currentPage = computed(() => {
    const l = limit.value;
    const o = currentOffset.value;
    if (l <= 0) return 0;
    return Math.floor(o / l) + 1;
  });

  const setPageSize = (size: number) => {
    params.value = {
      ...params.value,
      limit: size,
      offset: 0,
    };
    void refresh();
  };

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
    const l = limit.value;
    params.value = {
      ...params.value,
      offset: currentOffset.value + l,
    };
    void refresh();
  };

  const previousPage = () => {
    const l = limit.value;
    params.value = {
      ...params.value,
      offset: Math.max(0, currentOffset.value - l),
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
    setPageSize,
    lastUpdated,
    source,
    warnings,
    count,
    hasMore,
    limit,
    currentOffset,
    currentPage,
    totalPages,
  };
};
