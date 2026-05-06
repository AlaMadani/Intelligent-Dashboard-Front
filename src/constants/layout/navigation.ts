// Navigation metadata extracted from layout component implementation.
import type { NavigationItemConfig } from 'src/types/navigation';

export const LAYOUT_NAVIGATION_ITEMS: NavigationItemConfig[] = [
  {
    id: 'overview',
    route: '/',
    labelKey: 'layout.navigation.overview.label',
    captionKey: 'layout.navigation.overview.caption',
    icon: 'dashboard',
  },
  {
    id: 'anomalies',
    route: '/anomalies',
    labelKey: 'layout.navigation.anomalies.label',
    captionKey: 'layout.navigation.anomalies.caption',
    icon: 'warning',
  },
  {
    id: 'workbench',
    route: '/workbench',
    labelKey: 'layout.navigation.workbench.label',
    captionKey: 'layout.navigation.workbench.caption',
    icon: 'hub',
  },
  {
    id: 'sessions',
    route: '/sessions',
    labelKey: 'layout.navigation.sessions.label',
    captionKey: 'layout.navigation.sessions.caption',
    icon: 'analytics',
  },
  {
    id: 'insights',
    route: '/insights',
    labelKey: 'layout.navigation.insights.label',
    captionKey: 'layout.navigation.insights.caption',
    icon: 'manage_search',
  },
  {
    id: 'analytics',
    route: '/analytics',
    labelKey: 'layout.navigation.analytics.label',
    captionKey: 'layout.navigation.analytics.caption',
    icon: 'insights',
  },
];
