import type { FeedTab, Run } from '../mock';

export type SocialTab = 'feed' | 'leaderboards';

export type MainTabParamList = {
  Feed: { initialSocialTab?: SocialTab; initialFeedTab?: FeedTab } | undefined;
  Match: undefined;
  Team: undefined;
  Me: undefined;
};

export type RootStackParamList = {
  MainTabs: { screen?: keyof MainTabParamList; params?: MainTabParamList[keyof MainTabParamList] } | undefined;
  Run: undefined;
  RunDetail: { run: Run };
  TeamMatch: { matchId?: string };
  SoloMatch: { matchId?: string };
  TeamDetail: { teamId: string };
  Settings: undefined;
  UserProfile: { userId: string };
  BlockedUsers: undefined;
  DevSoloMatchScreenshot: undefined;
  DevTeamScreenshot: undefined;
  DevRankMedal: undefined;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
