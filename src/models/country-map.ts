// Country map models separate domain structures from component implementation details.
export interface CountryCount {
  label: string;
  count: number;
  display?: string;
}

export interface CountryCoordinate {
  label: string;
  region: string;
  x: number;
  y: number;
}

export interface MappedCountry {
  key: string;
  label: string;
  region: string;
  count: number;
  display: string | undefined;
  isMapped: boolean;
  x: number;
  y: number;
  radius: number;
}
