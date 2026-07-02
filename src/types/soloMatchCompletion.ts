export type SoloMatchOutcome = 'win' | 'loss' | 'tie';

export type SoloMatchCompletion = {
  matchId: string;
  outcome: SoloMatchOutcome;
  myPoints: number;
  opponentPoints: number;
  opponentName: string;
  ratingDelta: number;
  newRating: number;
  previousRating: number;
  seasonWins?: number;
  seasonLosses?: number;
};
