<template>
  <div class="neo-journey-card">
    <div class="neo-journey-head">
      <h3>Process deviation</h3>
      <p>Observed navigation path with rare transitions highlighted.</p>
    </div>

    <div v-if="!stepList.length" class="neo-journey-empty">No action sequence available for this session.</div>

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
      <q-chip v-if="pathDeviation" dense color="warning" text-color="black">Path deviation detected</q-chip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PathDeviationDto } from 'src/types/analytics';

const props = defineProps<{
  steps?: string[] | null;
  rareTransitions?: PathDeviationDto[] | null;
  pathDeviation?: boolean | null;
}>();

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
  border-radius: 24px;
  background: rgba(255, 250, 243, 0.9);
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
  background: rgba(47, 143, 131, 0.12);
  color: var(--neo-accent);
  font-weight: 700;
  font-size: 13px;
}

.neo-journey-node.is-anomalous {
  background: rgba(220, 38, 38, 0.14);
  color: #b91c1c;
}

.neo-journey-link {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  color: var(--neo-accent);
  background: rgba(47, 143, 131, 0.08);
}

.neo-journey-link.is-anomalous {
  color: #b91c1c;
  background: rgba(220, 38, 38, 0.12);
}

.neo-journey-tags {
  margin-top: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
