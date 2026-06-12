import { SoloMatchTab, TeamMatchTab } from '../components/match';
import type { MatchTab } from '../mock';

type MatchScreenProps = {
  activeTab: MatchTab;
  onOpenTeamMatch?: () => void;
};

export function MatchScreen({ activeTab, onOpenTeamMatch }: MatchScreenProps) {
  if (activeTab === 'solo') {
    return <SoloMatchTab />;
  }

  return <TeamMatchTab onViewActiveMatch={onOpenTeamMatch} />;
}
