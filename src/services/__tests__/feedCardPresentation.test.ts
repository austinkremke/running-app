import type { PostRunSummary } from '../../mock';
import { paceHighlightFromSummary, photoUrlFromPost } from '../feedCardPresentation';

const summary: PostRunSummary = {
  completedAtLabel: 'Jun 1, 2026',
  distanceMiles: 3.42,
  duration: '28',
  durationUnit: 'min',
  avgPace: '8:15',
  avgPaceUnit: '/mi',
  calories: 320,
  caloriesUnit: 'kcal',
  avgHeartRate: 152,
  avgHeartRateUnit: 'bpm',
  elevationGain: 120,
  elevationGainUnit: 'ft',
  photos: ['https://example.com/run.jpg'],
  chartData: {
    pace: [
      { distanceMiles: 0.5, value: 510 },
      { distanceMiles: 1.5, value: 462 },
      { distanceMiles: 2.5, value: 498 },
    ],
    elevation: [],
    heartRate: [],
  },
  chartReferenceLines: {},
};

describe('paceHighlightFromSummary', () => {
  it('returns the fastest split from pace chart data', () => {
    const highlight = paceHighlightFromSummary(summary);

    expect(highlight).toEqual({
      label: 'Fastest split',
      value: '7:42 /mi',
      detail: 'at 1.5 mi',
    });
  });

  it('returns null when pace data is missing', () => {
    expect(paceHighlightFromSummary(null)).toBeNull();
  });
});

describe('photoUrlFromPost', () => {
  it('prefers the feed post photo url', () => {
    expect(photoUrlFromPost('https://post.jpg', summary)).toBe('https://post.jpg');
  });

  it('falls back to summary photos', () => {
    expect(photoUrlFromPost(null, summary)).toBe('https://example.com/run.jpg');
  });
});
