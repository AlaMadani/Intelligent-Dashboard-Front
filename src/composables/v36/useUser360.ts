import { computed, type Ref, ref, shallowRef, watch } from 'vue';
import { getV36User360, getV36UserAlerts, normalizeApiError } from 'src/services/analytics';
import type {
  V36User360Response,
  V36UserAlertsParams,
  V36UserAlertsResponse,
} from 'src/types/analytics';
import { safeArray } from 'src/utils/format';
import { throttle } from 'src/utils/throttle';
import { useV36SseRefresh } from './useV36SseRefresh';

export const useUser360 = (insuredId: Ref<string>) => {
  const data = shallowRef<V36User360Response | null>(null);
  const alerts = shallowRef<V36UserAlertsResponse | null>(null);
  const params = ref<V36UserAlertsParams>({ limit: 25, offset: 0 });
  const loading = ref(false);
  const error = ref('');
  const lastUpdated = ref<Date | null>(null);

  const alertItems = computed(() => alerts.value?.items ?? []);
  const source = computed(() => data.value?.source ?? alerts.value?.source ?? '');
  const warnings = computed(() => [
    ...safeArray<string>(data.value?.warnings),
    ...safeArray<string>(alerts.value?.warnings),
  ]);

  const refresh = async (silent = false) => {
    const currentInsuredId = insuredId.value.trim();
    if (!currentInsuredId) return;

    if (!silent) loading.value = true;
    error.value = '';

    try {
      const [userResponse, alertsResponse] = await Promise.all([
        getV36User360(currentInsuredId),
        getV36UserAlerts(currentInsuredId, params.value),
      ]);
      data.value = userResponse.data ?? null;
      alerts.value = alertsResponse.data ?? null;
      lastUpdated.value = new Date();
    } catch (err) {
      error.value = normalizeApiError(err).message;
    } finally {
      loading.value = false;
    }
  };

  watch(
    insuredId,
    () => {
      void refresh();
    },
    { immediate: true },
  );

  const throttledRefresh = throttle(() => { void refresh(true); }, 2000);
  useV36SseRefresh(['alerts'], () => {
    throttledRefresh();
  });

  return {
    data,
    alerts,
    alertItems,
    params,
    loading,
    error,
    refresh,
    lastUpdated,
    source,
    warnings,
  };
};
