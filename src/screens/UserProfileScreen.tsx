import { MeScreen } from './MeScreen';

type UserProfileScreenProps = {
  userId: string;
  onBack?: () => void;
};

/**
 * Read-only view of another user's profile — a thin wrapper around `MeScreen`
 * itself (not a separate page) so the two stay visually and structurally
 * identical by construction. `MeScreen` handles hiding the viewer-exclusive
 * bits (Progress/Competitive pills, settings cog, mini XP bar, achievements)
 * once `viewedUserId` differs from the signed-in user.
 */
export function UserProfileScreen({ userId, onBack }: UserProfileScreenProps) {
  return <MeScreen onBack={onBack} viewedUserId={userId} />;
}
