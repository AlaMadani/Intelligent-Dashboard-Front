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
import { throttle } from 'src/utils/throttle';
import { useV36SseRefresh } from './useV36SseRefresh';

export const useChurnDashboard = () => {
  // ---- State ----
  const data = shallowRef<V36ChurnDashboardResponse | null>(null);
  const users = shallowRef<V36ChurnUsersResponse | null>(null);
  const params = ref<V36ChurnUsersParams>({ limit: 20, offset: 0 });
  const loading = ref(false);
  const error = ref('');
  const lastUpdated = ref<Date | null>(null);

  // ---- Computed ----
  const userItems = computed(() => {
    const raw = users.value?.items ?? data.value?.topChurnRiskUsers ?? [];
    const seen = new Map<string, (typeof raw)[number]>();
    let anonIdx = 0;
    for (const item of raw) {
      const id = item.insuredId;
      if (!id) { seen.set(`__anon__${anonIdx++}`, item); continue; }
      const existing = seen.get(id);
      if (!existing || (item.churnProbability ?? 0) > (existing.churnProbability ?? 0)) {
        seen.set(id, item);
      }
    }
    return [...seen.values()];
  });
  const count = computed(() => users.value?.count ?? data.value?.topChurnRiskUsers?.length ?? 0);
  const hasMore = computed(() => users.value?.hasMore ?? false);
  const source = computed(() => data.value?.source ?? users.value?.source ?? '');
  const warnings = computed(() => [
    ...safeArray<string>(data.value?.warnings),
    ...safeArray<string>(users.value?.warnings),
  ]);

  // ---- Methods ----
  const refresh = async (silent = false) => {
    if (!silent) loading.value = true;
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

  // ---- Pagination ----
  const nextPage = () => {
    if (!hasMore.value) return;
    const limit = params.value.limit ?? 20;
    params.value = {
      ...params.value,
      offset: (params.value.offset ?? 0) + limit,
    };
    void refresh();
  };

  const previousPage = () => {
    const limit = params.value.limit ?? 20;
    params.value = {
      ...params.value,
      offset: Math.max(0, (params.value.offset ?? 0) - limit),
    };
    void refresh();
  };

  // ---- Lifecycle ----
  onMounted(() => {
    void refresh();
  });

  // ---- SSE Refresh ----
  const throttledRefresh = throttle(() => { void refresh(true); }, 10000);
  useV36SseRefresh(['churn'], () => {
    throttledRefresh();
  });

  // ---- Return ----
  return {
    data,
    users,
    userItems,
    count,
    hasMore,
    params,
    loading,
    error,
    refresh,
    nextPage,
    previousPage,
    lastUpdated,
    source,
    warnings,
  };
};
