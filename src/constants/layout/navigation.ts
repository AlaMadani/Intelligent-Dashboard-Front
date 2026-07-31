// ---- Imports ----
import { ROUTE_NAMES } from 'src/router/route-names';
import type { NavigationItemConfig } from 'src/types/navigation';

// ---- Navigation Items ----
export const LAYOUT_NAVIGATION_ITEMS: NavigationItemConfig[] = [
  {
    id: 'security-overview',
    routeName: ROUTE_NAMES.SECURITY_OVERVIEW,
    labelKey: 'layout.navigation.securityOverview.label',
    captionKey: 'layout.navigation.securityOverview.caption',
    icon: 'dashboard',
  },
  {
    id: 'alerts',
    routeName: ROUTE_NAMES.ALERTS,
    labelKey: 'layout.navigation.alerts.label',
    captionKey: 'layout.navigation.alerts.caption',
    icon: 'notification_important',
  },
  {
    id: 'user360',
    routeName: ROUTE_NAMES.USER_360,
    labelKey: 'layout.navigation.user360.label',
    captionKey: 'layout.navigation.user360.caption',
    icon: 'manage_accounts',
  },
  {
    id: 'churn',
    routeName: ROUTE_NAMES.CHURN,
    labelKey: 'layout.navigation.churn.label',
    captionKey: 'layout.navigation.churn.caption',
    icon: 'trending_down',
  },
  {
    id: 'forecast',
    routeName: ROUTE_NAMES.FORECAST,
    labelKey: 'layout.navigation.forecast.label',
    captionKey: 'layout.navigation.forecast.caption',
    icon: 'show_chart',
  },
  {
    id: 'runtime',
    routeName: ROUTE_NAMES.RUNTIME_HEALTH,
    labelKey: 'layout.navigation.runtime.label',
    captionKey: 'layout.navigation.runtime.caption',
    icon: 'health_and_safety',
  },
];
