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

