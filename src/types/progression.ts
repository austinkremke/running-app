export type XpSource = 'run' | 'match' | 'achievement' | 'onboarding' | 'bonus';

export type XpBreakdownLine = {
  key: 'distance' | 'pace' | 'elevation' | 'duration' | 'streak' | 'first-run-today' | 'match-win';
  label: string;
  xp: number;
};

export type XpLedgerEntry = {
  id: string;
  awardedAt: string;
  totalXp: number;
  source: XpSource;
  sourceId?: string;
  breakdown: XpBreakdownLine[];
};

export type StoredProgression = {
  totalXp: number;
  ledger: XpLedgerEntry[];
  streakDays: number;
  lastAwardDate?: string;
  rollingAvgPaceSec: number | null;
};
