import {
  MATCH_MIN_DISTANCE_METERS,
  MATCH_PACE_MULTIPLIER_MAX,
  MATCH_PACE_MULTIPLIER_MIN,
  MATCH_REFERENCE_PACE_SEC_PER_MILE,
  matchPointsForActivity,
  matchPointsForDistanceMeters,
} from '../matchScoring';

describe('matchScoring', () => {
  it('returns zero below minimum distance', () => {
    expect(matchPointsForDistanceMeters(100)).toBe(0);
    expect(matchPointsForDistanceMeters(160)).toBe(0);
  });

  it('awards at least one point for qualifying runs', () => {
    expect(matchPointsForDistanceMeters(1609.34)).toBe(10);
    expect(matchPointsForDistanceMeters(3218.68)).toBe(20);
  });

  it('rounds miles to points at ten per mile when pace is unknown', () => {
    expect(matchPointsForDistanceMeters(804.67)).toBe(5);
  });

  it('rewards faster pace on the same distance', () => {
    const oneMile = MATCH_MIN_DISTANCE_METERS * 10;
    const eightMinuteMile = 8 * 60;
    const tenMinuteMile = 10 * 60;
    const twelveMinuteMile = 12 * 60;

    const fastPoints = matchPointsForActivity(oneMile, eightMinuteMile);
    const neutralPoints = matchPointsForActivity(oneMile, tenMinuteMile);
    const slowPoints = matchPointsForActivity(oneMile, twelveMinuteMile);

    expect(fastPoints).toBeGreaterThan(neutralPoints);
    expect(neutralPoints).toBeGreaterThan(slowPoints);
    expect(neutralPoints).toBe(10);
    expect(fastPoints).toBe(13);
    expect(slowPoints).toBe(9);
  });

  it('clamps pace multiplier to configured bounds', () => {
    const oneMile = 1609.34;
    const veryFast = matchPointsForActivity(oneMile, 4 * 60);
    const verySlow = matchPointsForActivity(oneMile, 20 * 60);

    expect(veryFast).toBe(Math.round(10 * MATCH_PACE_MULTIPLIER_MAX));
    expect(verySlow).toBe(Math.round(10 * MATCH_PACE_MULTIPLIER_MIN));
    expect(MATCH_REFERENCE_PACE_SEC_PER_MILE).toBe(600);
  });
});
