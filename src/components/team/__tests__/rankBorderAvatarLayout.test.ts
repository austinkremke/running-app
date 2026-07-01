import { rankBorderAvatarLayout } from '../rankBorderLayout';

describe('rankBorderAvatarLayout', () => {
  it('sizes bronze avatar to the measured inner hole diameter', () => {
    const layout = rankBorderAvatarLayout(72, 'bronze');

    expect(layout.avatarDiameter).toBe(50);
    expect(layout.avatarLeft).toBeCloseTo(11.12, 1);
    expect(layout.avatarTop).toBeCloseTo(10.96, 1);
  });

  it('falls back to the default ratio when tier meta is missing', () => {
    const layout = rankBorderAvatarLayout(72, 'unknown');

    expect(layout.avatarDiameter).toBe(53);
    expect(layout.avatarLeft).toBe(9.5);
    expect(layout.avatarTop).toBe(9.5);
  });
});
