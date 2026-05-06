export interface NavigationItemConfig {
  id: string;
  route: string;
  icon: string;
  labelKey: string;
  captionKey: string;
}

export interface NavigationItem {
  id: string;
  route: string;
  label: string;
  caption: string;
  icon: string;
}
