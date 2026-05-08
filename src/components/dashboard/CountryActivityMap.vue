<template>
  <!-- Stylized geography card: plot active countries on the map and mirror them in a ranked list. -->
  <div class="neo-geo-shell">
    <div class="neo-geo-map">
      <CountryActivityMapSvg
        :mapped-countries="mappedCountries"
        :meridians="COUNTRY_MAP_MERIDIANS"
      />
    </div>

    <!-- The side list keeps the telemetry readable even when a country cannot be mapped. -->
    <div class="neo-geo-list">
      <div v-if="normalizedCountries.length" class="neo-geo-list-title">
        {{ t('countryActivityMap.activeCountries') }}
        <span class="neo-geo-list-meta">
          {{ t('countryActivityMap.mappedCount', { count: mappedCountries.length }) }}
        </span>
      </div>
      <div
        v-for="country in normalizedCountries"
        :key="country.key"
        class="neo-geo-list-row"
        :class="{ 'is-unmapped': !country.isMapped }"
      >
        <div>
          <div class="neo-geo-country">{{ country.label }}</div>
          <div class="neo-geo-region">
            {{ country.region }}
            <span v-if="!country.isMapped">
              / {{ t('countryActivityMap.coordinateUnavailable') }}
            </span>
          </div>
        </div>
        <strong>{{ country.display ?? formatNumber(country.count) }}</strong>
      </div>
      <div v-if="!normalizedCountries.length" class="neo-geo-empty">
        {{ t('countryActivityMap.noTelemetry') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Transform country telemetry into SVG marker coordinates and a readable companion list.
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import CountryActivityMapSvg from 'src/components/dashboard/svg/CountryActivityMapSvg.vue';
import {
  COUNTRY_ALIASES_TO_CODE,
  COUNTRY_COORDINATES_BY_CODE,
  COUNTRY_MAP_MERIDIANS,
} from 'src/constants/dashboard/country-map';
import type { CountryCount, MappedCountry } from 'src/models/country-map';
import { formatNumber } from 'src/utils/format';

const props = defineProps<{
  countries: CountryCount[];
}>();

const { t } = useI18n();

// Normalization helpers keep inconsistent backend country labels mappable.
const normalizeCountryKey = (value: string) => value.toUpperCase().replace(/[^A-Z]/g, '');

// Merge telemetry counts with map coordinates and marker sizing for rendering.
const normalizedCountries = computed<MappedCountry[]>(() => {
  const max = Math.max(...props.countries.map((country) => country.count), 0) || 1;

  return props.countries.map((country) => {
    const sourceKey = normalizeCountryKey(country.label);
    const countryCode = COUNTRY_ALIASES_TO_CODE[sourceKey] ?? sourceKey;
    const coordinate = COUNTRY_COORDINATES_BY_CODE[countryCode];

    return {
      key: `${country.label}-${country.display ?? country.count}`,
      label: coordinate?.label ?? country.label,
      region: coordinate?.region ?? t('countryActivityMap.unknownRegion'),
      count: country.count,
      display: country.display,
      isMapped: Boolean(coordinate),
      x: coordinate?.x ?? 0,
      y: coordinate?.y ?? 0,
      radius: 7 + (country.count / max) * 10,
    };
  });
});

const mappedCountries = computed(() =>
  normalizedCountries.value.filter((country) => country.isMapped),
);
</script>

<style scoped>
/* Map shell, SVG styling, and ranked-country list presentation. */
.neo-geo-shell {
  display: grid;
  gap: 16px;
}

.neo-geo-map {
  border-radius: var(--neo-radius-card);
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(180deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(180deg, #13232d 0%, #1a3542 100%);
  background-size: 42px 42px, 42px 42px, auto;
  border: 1px solid rgba(222, 231, 229, 0.16);
  overflow: hidden;
}

.neo-geo-map :deep(svg) {
  width: 100%;
  height: auto;
  display: block;
}

.neo-geo-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.neo-geo-list-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--neo-ink-muted);
}

.neo-geo-list-meta {
  letter-spacing: normal;
  text-transform: none;
  font-weight: 700;
}

.neo-geo-list-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border: var(--neo-border);
  border-radius: var(--neo-radius-card);
  background: rgba(23, 33, 43, 0.035);
}

.neo-geo-list-row.is-unmapped {
  border-color: rgba(179, 75, 60, 0.18);
  background: var(--neo-critical-bg);
}

.neo-geo-country {
  font-size: 13px;
  font-weight: 600;
  color: var(--neo-ink);
}

.neo-geo-region {
  font-size: 12px;
  color: var(--neo-ink-muted);
}

.neo-geo-empty {
  min-height: 120px;
  display: grid;
  place-items: center;
  font-size: 13px;
  color: var(--neo-ink-muted);
  background: rgba(8, 25, 34, 0.04);
  border-radius: var(--neo-radius-card);
}
</style>
