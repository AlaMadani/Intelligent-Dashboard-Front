import type { RouteName } from 'src/router/route-names';

// ---- Navigation Config ----
export interface NavigationItemConfig {
  id: string;
  routeName: RouteName;
  icon: string;
  labelKey: string;
  captionKey: string;
}

// ---- Runtime Item ----
export interface NavigationItem {
  id: string;
  routeName: RouteName;
  label: string;
  caption: string;
  icon: string;
}
