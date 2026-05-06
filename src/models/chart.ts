// Reusable charting models shared by SVG visualization components.
export interface Point {
  x: number;
  y: number;
  value: number;
  label: string;
  isLast: boolean;
}

export interface Tick {
  value: number;
  position: number;
}

export interface BarChartRow {
  label: string;
  value: number;
  display?: string;
}

export interface DonutSegment {
  label: string;
  value: number;
  display?: string;
  color?: string;
}

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
