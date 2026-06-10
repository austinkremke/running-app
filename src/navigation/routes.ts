import { ComponentType } from 'react';

import { MatchScreen, MeScreen, RunScreen } from '../screens';

export type AppRoute = 'feed' | 'run' | 'match' | 'me';

type RouteConfig = {
  title: string;
  screen?: ComponentType;
  showFeedTabs: boolean;
};

export const ROUTES: Record<AppRoute, RouteConfig> = {
  feed: { title: 'FEED', showFeedTabs: true },
  run: { title: 'RUN', screen: RunScreen, showFeedTabs: false },
  match: { title: 'MATCH', screen: MatchScreen, showFeedTabs: false },
  me: { title: 'ME', screen: MeScreen, showFeedTabs: false },
};

export function isAppRoute(key: string): key is AppRoute {
  return key in ROUTES;
}
