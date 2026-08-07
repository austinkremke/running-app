import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useUserId } from '../context';
import type { RootStackParamList } from './types';

/** Opening your own profile jumps to the Me tab instead of pushing a
 *  read-only UserProfile screen on top of it. */
export function useOpenProfile() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const viewerUserId = useUserId();

  return (profileUserId: string) => {
    if (profileUserId === viewerUserId) {
      navigation.navigate('MainTabs', { screen: 'Me' });
      return;
    }

    navigation.navigate('UserProfile', { userId: profileUserId });
  };
}
