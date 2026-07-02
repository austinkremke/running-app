import { useEffect } from 'react';

import { SoloMatchTab, TeamMatchTab } from '../components/match';
import type { MatchTab } from '../mock';
import { useSoloMatchCompletion } from '../context';

type MatchScreenProps = {
  activeTab: MatchTab;
  onOpenTeamMatch?: () => void;
  onOpenSoloMatch?: () => void;
};

export function MatchScreen({ activeTab, onOpenTeamMatch, onOpenSoloMatch }: MatchScreenProps) {
  const { syncCompletions } = useSoloMatchCompletion();

  useEffect(() => {
    void syncCompletions();
  }, [syncCompletions]);

  if (activeTab === 'solo') {
    return <SoloMatchTab onViewActiveMatch={onOpenSoloMatch} />;
  }

  return <TeamMatchTab onViewActiveMatch={onOpenTeamMatch} />;
}
