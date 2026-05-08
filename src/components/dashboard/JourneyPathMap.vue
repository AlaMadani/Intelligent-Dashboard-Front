<template>
  <div class="neo-journey-card">
    <div class="neo-journey-head">
      <h3>{{ t('journeyPathMap.title') }}</h3>
      <p>{{ t('journeyPathMap.subtitle') }}</p>
    </div>

    <div v-if="!stepList.length" class="neo-journey-empty">{{ t('journeyPathMap.empty') }}</div>

    <div v-else class="neo-journey-flow">
      <template v-for="(step, index) in stepList" :key="`${step}-${index}`">
        <div class="neo-journey-node" :class="nodeClass(step)">
          {{ step }}
        </div>
        <div v-if="index < stepList.length - 1" class="neo-journey-link" :class="linkClass(step, stepList[index + 1])">
          <q-icon :name="isRare(step, stepList[index + 1]) ? 'north_east' : 'trending_flat'" size="18px" />
        </div>
      </template>
    </div>

    <div class="neo-journey-tags">
      <q-chip
        v-for="transition in visibleRareTransitions"
        :key="`${transition.fromAction}-${transition.toAction}`"
        dense
        color="negative"
        text-color="white"
      >
        {{ transition.fromAction }} -> {{ transition.toAction }}
      </q-chip>
      <q-chip v-if="pathDeviation" dense color="warning" text-color="black">
        {{ t('journeyPathMap.pathDeviationDetected') }}
      </q-chip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { PathDeviationDto } from 'src/types/analytics';

const props = defineProps<{
  steps?: string[] | null;
  rareTransitions?: PathDeviationDto[] | null;
  pathDeviation?: boolean | null;
}>();

const { t } = useI18n();

const visibleRareTransitions = computed(() =>
  (props.rareTransitions ?? []).filter(
    (item) => item?.fromAction && item?.toAction && item.deviated !== false,
  ),
);

const stepList = computed(() => props.steps ?? []);

const isRare = (fromAction?: string | null, toAction?: string | null) =>
  visibleRareTransitions.value.some(
    (item) => item.fromAction === fromAction && item.toAction === toAction,
  );

const nodeClass = (step: string) => ({
  'is-anomalous': visibleRareTransitions.value.some(
    (item) => item.fromAction === step || item.toAction === step,
  ),
});

const linkClass = (fromAction?: string | null, toAction?: string | null) => ({
  'is-anomalous': isRare(fromAction, toAction),
});
</script>

<style scoped>
.neo-journey-card {
  padding: 20px;
  border-radius: var(--neo-radius-card);
  background: rgba(255, 255, 255, 0.74);
  border: var(--neo-border);
}

.neo-journey-head h3 {
  margin: 0;
  font-size: 18px;
}

.neo-journey-head p {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--neo-ink-muted);
}

.neo-journey-empty {
  margin-top: 16px;
  color: var(--neo-ink-muted);
  font-size: 13px;
}

.neo-journey-flow {
  margin-top: 18px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.neo-journey-node {
  padding: 10px 14px;
  border-radius: 999px;
  background: var(--neo-success-bg);
  color: var(--neo-success-contrast);
  font-weight: 700;
  font-size: 13px;
}

.neo-journey-node.is-anomalous {
  background: var(--neo-critical-bg);
  color: var(--neo-critical-contrast);
}

.neo-journey-link {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  color: var(--neo-success-contrast);
  background: var(--neo-success-bg);
}

.neo-journey-link.is-anomalous {
  color: var(--neo-critical-contrast);
  background: var(--neo-critical-bg);
}

.neo-journey-tags {
  margin-top: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
