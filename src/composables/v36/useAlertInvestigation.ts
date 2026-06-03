import { computed, type Ref, ref, shallowRef, watch } from 'vue';
import { getV36AlertInvestigation, normalizeApiError } from 'src/services/analytics';
import type { V36AlertInvestigationDetail } from 'src/types/analytics';
import { safeArray } from 'src/utils/format';
import { useV36SseRefresh } from './useV36SseRefresh';

export const useAlertInvestigation = (eventId: Ref<string>) => {
  const data = shallowRef<V36AlertInvestigationDetail | null>(null);
  const loading = ref(false);
  const error = ref('');
  const lastUpdated = ref<Date | null>(null);

  const source = computed(() => data.value?.source ?? '');
  const warnings = computed(() => [
    ...safeArray<string>(data.value?.warnings),
    ...safeArray<string>(data.value?.runtimeWarnings),
    ...safeArray<string>(data.value?.forecastContext?.forecastWarnings),
  ]);

  const refresh = async () => {
    const currentEventId = eventId.value.trim();
    if (!currentEventId) return;

    loading.value = true;
    error.value = '';

    try {
      const response = await getV36AlertInvestigation(currentEventId);
      data.value = response.data ?? null;
      lastUpdated.value = new Date();
    } catch (err) {
      error.value = normalizeApiError(err).message;
      data.value = null;
    } finally {
      loading.value = false;
    }
  };

  watch(
    eventId,
    () => {
      void refresh();
    },
    { immediate: true },
  );

  useV36SseRefresh(['alerts'], () => {
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
