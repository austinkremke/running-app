export type TeamMatchOutcome = 'win' | 'loss' | 'tie';

export type TeamMatchCompletion = {
  matchId: string;
  outcome: TeamMatchOutcome;
  myPoints: number;
  opponentPoints: number;
  opponentTeamName: string;
  ratingDelta: number;
  newRating: number;
  seasonWins?: number;
  seasonLosses?: number;
};
