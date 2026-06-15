import { SoloMatchTab, TeamMatchTab } from '../components/match';
import type { MatchTab } from '../mock';

type MatchScreenProps = {
  activeTab: MatchTab;
  onOpenTeamMatch?: () => void;
  onOpenSoloMatch?: () => void;
};

export function MatchScreen({ activeTab, onOpenTeamMatch, onOpenSoloMatch }: MatchScreenProps) {
  if (activeTab === 'solo') {
    return <SoloMatchTab onViewActiveMatch={onOpenSoloMatch} />;
  }

  return <TeamMatchTab onViewActiveMatch={onOpenTeamMatch} />;
}
