import { matchPointsForDistanceMeters } from '../matchScoring';

describe('matchScoring', () => {
  it('returns zero below minimum distance', () => {
    expect(matchPointsForDistanceMeters(100)).toBe(0);
    expect(matchPointsForDistanceMeters(160)).toBe(0);
  });

  it('awards at least one point for qualifying runs', () => {
    expect(matchPointsForDistanceMeters(1609.34)).toBe(10);
    expect(matchPointsForDistanceMeters(3218.68)).toBe(20);
  });

  it('rounds miles to points at ten per mile', () => {
    expect(matchPointsForDistanceMeters(804.67)).toBe(5);
  });
});
