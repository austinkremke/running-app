import { rankBorderAvatarLayout } from '../rankBorderLayout';

describe('rankBorderAvatarLayout', () => {
  it('insets the avatar by the ring width plus a gap for a known tier', () => {
    const layout = rankBorderAvatarLayout(72, 'bronze');

    expect(layout.ringWidth).toBe(5);
    expect(layout.avatarDiameter).toBe(56);
    expect(layout.avatarLeft).toBe(8);
    expect(layout.avatarTop).toBe(8);
  });

  it('renders no ring and fills the frame for an unknown tier', () => {
    const layout = rankBorderAvatarLayout(72, 'unknown');

    expect(layout.ringWidth).toBe(0);
    expect(layout.avatarDiameter).toBe(72);
    expect(layout.avatarLeft).toBe(0);
    expect(layout.avatarTop).toBe(0);
  });
});
