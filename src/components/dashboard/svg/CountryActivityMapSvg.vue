<template>
  <svg viewBox="0 0 1000 520" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <defs>
      <radialGradient id="neo-geo-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="rgba(227, 165, 72, 0.95)" />
        <stop offset="100%" stop-color="rgba(227, 165, 72, 0)" />
      </radialGradient>
    </defs>

    <g class="neo-geo-grid">
      <path v-for="line in meridians" :key="line" :d="line" />
    </g>

    <g class="neo-geo-continents">
      <path v-for="path in COUNTRY_MAP_CONTINENT_PATHS" :key="path" :d="path" />
    </g>

    <g class="neo-geo-markers">
      <g v-for="country in mappedCountries" :key="country.key">
        <circle
          class="neo-geo-marker-glow"
          :cx="country.x"
          :cy="country.y"
          :r="country.radius * 2.6"
          fill="url(#neo-geo-glow)"
        />
        <circle class="neo-geo-marker" :cx="country.x" :cy="country.y" :r="country.radius" />
      </g>
    </g>
  </svg>
</template>

<script setup lang="ts">
import { COUNTRY_MAP_CONTINENT_PATHS } from 'src/constants/dashboard/country-map';
import type { MappedCountry } from 'src/models/country-map';

defineProps<{
  mappedCountries: MappedCountry[];
  meridians: readonly string[];
}>();
</script>

<style scoped>
.neo-geo-grid path {
  fill: none;
  stroke: rgba(163, 210, 208, 0.1);
  stroke-width: 1.6;
}

.neo-geo-continents path {
  fill: rgba(132, 182, 180, 0.2);
  stroke: rgba(188, 229, 221, 0.2);
  stroke-width: 2;
}

.neo-geo-marker {
  fill: #f8c56c;
  stroke: rgba(255, 248, 235, 0.86);
  stroke-width: 3;
}
</style>

