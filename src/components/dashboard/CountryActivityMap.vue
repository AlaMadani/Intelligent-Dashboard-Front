<template>
  <div class="neo-geo-shell">
    <div class="neo-geo-map">
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
          <path
            d="M130 138 C170 98 240 76 286 98 C334 120 350 170 328 220 C310 258 270 278 244 316 C220 350 206 390 174 410 C144 428 102 420 84 390 C60 350 72 316 96 284 C126 244 116 182 130 138 Z"
          />
          <path
            d="M396 112 C464 84 580 78 648 104 C702 126 748 164 778 206 C810 252 822 306 792 342 C756 388 690 390 652 366 C614 342 590 286 552 266 C520 248 478 262 446 246 C392 220 350 176 396 112 Z"
          />
          <path
            d="M520 252 C556 232 606 238 632 270 C654 298 656 340 638 380 C620 422 578 456 548 454 C514 452 496 404 490 366 C482 320 482 274 520 252 Z"
          />
          <path
            d="M782 352 C810 338 860 340 892 360 C922 378 930 408 910 430 C886 456 838 458 806 442 C774 424 756 384 782 352 Z"
          />
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
            <circle
              class="neo-geo-marker"
              :cx="country.x"
              :cy="country.y"
              :r="country.radius"
            />
          </g>
        </g>
      </svg>
    </div>

    <div class="neo-geo-list">
      <div v-if="normalizedCountries.length" class="neo-geo-list-title">
        Active countries
        <span class="neo-geo-list-meta">{{ mappedCountries.length }} mapped</span>
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
            <span v-if="!country.isMapped">/ coordinate unavailable</span>
          </div>
        </div>
        <strong>{{ country.display ?? country.count.toLocaleString('en-GB') }}</strong>
      </div>
      <div v-if="!normalizedCountries.length" class="neo-geo-empty">
        No country telemetry in the current live window.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface CountryCount {
  label: string;
  count: number;
  display?: string;
}

interface CountryCoordinate {
  label: string;
  region: string;
  x: number;
  y: number;
}

const props = defineProps<{
  countries: CountryCount[];
}>();

const coordinatesByCode: Record<string, CountryCoordinate> = {
  US: { label: 'United States', region: 'North America', x: 212, y: 198 },
  CA: { label: 'Canada', region: 'North America', x: 200, y: 144 },
  MX: { label: 'Mexico', region: 'North America', x: 196, y: 244 },
  BR: { label: 'Brazil', region: 'South America', x: 286, y: 336 },
  AR: { label: 'Argentina', region: 'South America', x: 266, y: 414 },
  GB: { label: 'United Kingdom', region: 'Europe', x: 462, y: 158 },
  IE: { label: 'Ireland', region: 'Europe', x: 448, y: 154 },
  FR: { label: 'France', region: 'Europe', x: 486, y: 176 },
  ES: { label: 'Spain', region: 'Europe', x: 474, y: 192 },
  DE: { label: 'Germany', region: 'Europe', x: 504, y: 166 },
  IT: { label: 'Italy', region: 'Europe', x: 520, y: 190 },
  NL: { label: 'Netherlands', region: 'Europe', x: 494, y: 158 },
  BE: { label: 'Belgium', region: 'Europe', x: 490, y: 168 },
  LU: { label: 'Luxembourg', region: 'Europe', x: 498, y: 170 },
  PT: { label: 'Portugal', region: 'Europe', x: 458, y: 198 },
  CH: { label: 'Switzerland', region: 'Europe', x: 502, y: 180 },
  SE: { label: 'Sweden', region: 'Europe', x: 528, y: 128 },
  NO: { label: 'Norway', region: 'Europe', x: 508, y: 116 },
  PL: { label: 'Poland', region: 'Europe', x: 532, y: 164 },
  TR: { label: 'Turkey', region: 'Europe / West Asia', x: 560, y: 192 },
  NG: { label: 'Nigeria', region: 'Africa', x: 498, y: 294 },
  EG: { label: 'Egypt', region: 'Africa', x: 564, y: 252 },
  MA: { label: 'Morocco', region: 'Africa', x: 464, y: 242 },
  DZ: { label: 'Algeria', region: 'Africa', x: 492, y: 246 },
  KE: { label: 'Kenya', region: 'Africa', x: 594, y: 320 },
  ZA: { label: 'South Africa', region: 'Africa', x: 566, y: 410 },
  SA: { label: 'Saudi Arabia', region: 'Middle East', x: 610, y: 248 },
  AE: { label: 'United Arab Emirates', region: 'Middle East', x: 646, y: 258 },
  IN: { label: 'India', region: 'South Asia', x: 680, y: 266 },
  CN: { label: 'China', region: 'East Asia', x: 764, y: 208 },
  JP: { label: 'Japan', region: 'East Asia', x: 846, y: 196 },
  KR: { label: 'South Korea', region: 'East Asia', x: 816, y: 194 },
  SG: { label: 'Singapore', region: 'Southeast Asia', x: 744, y: 330 },
  ID: { label: 'Indonesia', region: 'Southeast Asia', x: 792, y: 354 },
  TH: { label: 'Thailand', region: 'Southeast Asia', x: 732, y: 292 },
  VN: { label: 'Vietnam', region: 'Southeast Asia', x: 754, y: 282 },
  PH: { label: 'Philippines', region: 'Southeast Asia', x: 786, y: 292 },
  AU: { label: 'Australia', region: 'Oceania', x: 846, y: 396 },
};

const aliasesToCode: Record<string, string> = {
  USA: 'US',
  UNITEDSTATES: 'US',
  UNITEDSTATESOFAMERICA: 'US',
  CANADA: 'CA',
  MEXICO: 'MX',
  BRAZIL: 'BR',
  ARGENTINA: 'AR',
  UK: 'GB',
  UNITEDKINGDOM: 'GB',
  GREATBRITAIN: 'GB',
  BRITAIN: 'GB',
  IRELAND: 'IE',
  FRANCE: 'FR',
  SPAIN: 'ES',
  GERMANY: 'DE',
  ITALY: 'IT',
  NETHERLANDS: 'NL',
  BELGIUM: 'BE',
  LUXEMBOURG: 'LU',
  PORTUGAL: 'PT',
  SWITZERLAND: 'CH',
  SWEDEN: 'SE',
  NORWAY: 'NO',
  POLAND: 'PL',
  TURKEY: 'TR',
  NIGERIA: 'NG',
  EGYPT: 'EG',
  MOROCCO: 'MA',
  ALGERIA: 'DZ',
  KENYA: 'KE',
  SOUTHAFRICA: 'ZA',
  SAUDIARABIA: 'SA',
  UNITEDARABEMIRATES: 'AE',
  UAE: 'AE',
  INDIA: 'IN',
  CHINA: 'CN',
  JAPAN: 'JP',
  SOUTHKOREA: 'KR',
  SINGAPORE: 'SG',
  INDONESIA: 'ID',
  THAILAND: 'TH',
  VIETNAM: 'VN',
  PHILIPPINES: 'PH',
  AUSTRALIA: 'AU',
  BEL: 'BE',
  CHE: 'CH',
  DEU: 'DE',
  ESP: 'ES',
  FRA: 'FR',
  ITA: 'IT',
  LUX: 'LU',
  NLD: 'NL',
  PRT: 'PT',
  GBR: 'GB',
  USAA: 'US',
};

const normalizeCountryKey = (value: string) => value.toUpperCase().replace(/[^A-Z]/g, '');

const normalizedCountries = computed(() => {
  const max = Math.max(...props.countries.map((country) => country.count), 0) || 1;

  return props.countries.map((country) => {
    const sourceKey = normalizeCountryKey(country.label);
    const countryCode = aliasesToCode[sourceKey] ?? sourceKey;
    const coordinate = coordinatesByCode[countryCode];

    return {
      key: `${country.label}-${country.display ?? country.count}`,
      label: coordinate?.label ?? country.label,
      region: coordinate?.region ?? 'Unknown region',
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
  normalizedCountries.value.filter((country) => country.isMapped)
);

const meridians = [
  'M 120 104 C 310 154 462 138 628 116 C 746 100 840 112 920 136',
  'M 116 202 C 316 248 518 240 710 206 C 820 186 886 188 930 200',
  'M 128 300 C 312 338 532 344 738 312 C 836 296 900 292 938 300',
  'M 158 82 C 132 164 126 258 146 420',
  'M 356 66 C 332 172 336 278 350 426',
  'M 560 56 C 544 180 548 296 560 436',
  'M 770 74 C 758 168 760 286 780 424',
];
</script>

<style scoped>
.neo-geo-shell {
  display: grid;
  gap: 16px;
}

.neo-geo-map {
  border-radius: 22px;
  background:
    radial-gradient(circle at 22% 18%, rgba(227, 165, 72, 0.2), transparent 26%),
    radial-gradient(circle at 76% 72%, rgba(47, 143, 131, 0.18), transparent 24%),
    linear-gradient(180deg, rgba(7, 24, 33, 0.95), rgba(10, 34, 48, 0.98));
  border: 1px solid rgba(146, 186, 189, 0.18);
  overflow: hidden;
}

.neo-geo-map svg {
  width: 100%;
  height: auto;
  display: block;
}

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
  border-radius: 14px;
  background: rgba(8, 25, 34, 0.04);
}

.neo-geo-list-row.is-unmapped {
  background: rgba(200, 90, 76, 0.06);
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
  border-radius: 18px;
}
</style>
