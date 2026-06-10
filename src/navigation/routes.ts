import { ComponentType } from 'react';

import { MeScreen, TeamScreen } from '../screens';

export type AppRoute = 'feed' | 'run' | 'match' | 'team' | 'me';

type RouteConfig = {
  title: string;
  screen?: ComponentType;
  showFeedTabs: boolean;
  showMatchTabs?: boolean;
  hideChrome?: boolean;
};

export const ROUTES: Record<AppRoute, RouteConfig> = {
  feed: { title: 'FEED', showFeedTabs: true },
  run: { title: 'RUN', showFeedTabs: false, hideChrome: true },
  match: {
    title: 'MATCHMAKING',
    showFeedTabs: false,
    showMatchTabs: true,
  },
  team: { title: 'TEAM', screen: TeamScreen, showFeedTabs: false },
  me: { title: 'ME', screen: MeScreen, showFeedTabs: false },
};

export function isAppRoute(key: string): key is AppRoute {
  return key in ROUTES;
}
