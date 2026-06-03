import type { RouteName } from 'src/router/route-names';

export interface NavigationItemConfig {
  id: string;
  routeName: RouteName;
  icon: string;
  labelKey: string;
  captionKey: string;
}

export interface NavigationItem {
  id: string;
  routeName: RouteName;
  label: string;
  caption: string;
  icon: string;
}
