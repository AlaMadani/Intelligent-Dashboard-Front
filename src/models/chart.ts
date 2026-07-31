// ---- Line Chart ----
export interface Point {
  x: number;
  y: number;
  value: number;
  label: string;
  isLast: boolean;
}

// ---- Ticks ----
export interface Tick {
  value: number;
  position: number;
}

// ---- Bar Chart ----
export interface BarChartRow {
  label: string;
  value: number;
  display?: string;
}

// ---- Donut Chart ----
export interface DonutSegment {
  label: string;
  value: number;
  display?: string;
  color?: string;
}

// ---- Forecast Chart ----
export interface ForecastPoint {
  label: string;
  forecast: number | null;
  trend: number | null;
  lower: number | null;
  upper: number | null;
}

export interface ForecastSeries {
  key: string;
  label: string;
  points: ForecastPoint[];
}
