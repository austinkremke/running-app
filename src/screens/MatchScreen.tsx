import { SoloMatchTab, TeamMatchTab } from '../components/match';
import type { MatchTab } from '../mock';

type MatchScreenProps = {
  activeTab: MatchTab;
};

export function MatchScreen({ activeTab }: MatchScreenProps) {
  if (activeTab === 'solo') {
    return <SoloMatchTab />;
  }

  return <TeamMatchTab />;
}
